import { randomUUID } from "node:crypto";
import { completeAiTask, phrasingSuggestionSchema, wrapUntrusted } from "@hireflow/ai";
import {
  type HireFlowDb,
  profile,
  resume,
  resumeAnalysis,
  resumeDocument,
  resumeExport,
  resumeJobMatch,
  resumeTailoringSession,
  resumeVersion,
  userSettings,
} from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import { getJobForUser } from "@hireflow/jobs";
import { matchResumeToJob } from "@hireflow/matching";
import {
  MAX_UPLOAD_BYTES,
  emptyStructuredResume,
  structuredResumeSchema,
  type ResumeTemplateId,
  type StructuredResume,
} from "@hireflow/shared";
import { and, desc, eq, isNull } from "drizzle-orm";
import { analyzeResume } from "./analysis";
import { ResumeError } from "./errors";
import { parseResumeFile } from "./parse";
import { deletePrivateFile, deleteUserUploadDir, readPrivateFile, writePrivateFile } from "./storage";
import { applicationPackForJob } from "./pack";
import { applyTailorDecisions, assertNoFabrication, buildTailorPlan, type TailorDecision } from "./tailor";

function asContent(value: unknown): StructuredResume {
  return structuredResumeSchema.parse(value);
}

async function ownedResume(db: HireFlowDb, userId: string, resumeId: string) {
  const row = await db.query.resume.findFirst({
    where: and(eq(resume.id, resumeId), eq(resume.userId, userId), isNull(resume.deletedAt)),
  });
  if (!row) throw new ResumeError("not_found", "Resume not found.", 404);
  return row;
}

async function currentContent(db: HireFlowDb, userId: string, resumeId: string) {
  const row = await ownedResume(db, userId, resumeId);
  if (!row.currentVersionId) throw new ResumeError("not_found", "Resume version missing.", 404);
  const version = await db.query.resumeVersion.findFirst({
    where: and(eq(resumeVersion.id, row.currentVersionId), eq(resumeVersion.userId, userId)),
  });
  if (!version) throw new ResumeError("not_found", "Resume version missing.", 404);
  return { row, version, content: asContent(version.content) };
}

async function countResumes(db: HireFlowDb, userId: string) {
  const rows = await db.query.resume.findMany({
    where: and(eq(resume.userId, userId), isNull(resume.deletedAt)),
  });
  return rows.length;
}

async function nextVersionNumber(db: HireFlowDb, resumeId: string) {
  const versions = await db
    .select()
    .from(resumeVersion)
    .where(eq(resumeVersion.resumeId, resumeId))
    .orderBy(desc(resumeVersion.versionNumber))
    .limit(1);
  return (versions[0]?.versionNumber ?? 0) + 1;
}

async function insertVersion(
  db: HireFlowDb,
  input: {
    resumeId: string;
    userId: string;
    content: StructuredResume;
    templateId: string;
    notes?: string;
    isOriginal?: boolean;
  },
) {
  const id = randomUUID();
  const versionNumber = await nextVersionNumber(db, input.resumeId);
  await db.insert(resumeVersion).values({
    id,
    resumeId: input.resumeId,
    userId: input.userId,
    versionNumber,
    notes: input.notes,
    templateId: input.templateId,
    content: input.content,
    isOriginal: input.isOriginal ?? false,
  });
  return id;
}

export async function listResumes(db: HireFlowDb, userId: string) {
  await assertEntitlement(userId, "resumes.studio");
  const rows = await db
    .select()
    .from(resume)
    .where(and(eq(resume.userId, userId), isNull(resume.deletedAt)))
    .orderBy(desc(resume.updatedAt));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    originKind: row.originKind,
    templateId: row.templateId,
    targetJobId: row.targetJobId,
    parentResumeId: row.parentResumeId,
    confirmedAt: row.confirmedAt,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  }));
}

export async function createBlankResume(db: HireFlowDb, userId: string, title?: string) {
  await assertEntitlement(userId, "resumes.studio");
  const used = await countResumes(db, userId);
  await assertEntitlement(userId, "resumes.max_versions", { used, increment: 1 });
  const id = randomUUID();
  const content = emptyStructuredResume();
  await db.insert(resume).values({
    id,
    userId,
    title: title?.trim() || "Untitled resume",
    originKind: "created",
    confirmedAt: new Date(),
  });
  const versionId = await insertVersion(db, {
    resumeId: id,
    userId,
    content,
    templateId: "professional-classic",
    notes: "Original",
    isOriginal: true,
  });
  await db
    .update(resume)
    .set({ originalVersionId: versionId, currentVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(resume.id, id), eq(resume.userId, userId)));
  return getResume(db, userId, id);
}

export async function parseUploadedResume(
  db: HireFlowDb,
  userId: string,
  file: { buffer: Buffer; filename: string; mimeType: string },
) {
  await assertEntitlement(userId, "resumes.parse_export");
  if (file.buffer.length > MAX_UPLOAD_BYTES) {
    throw new ResumeError("file_too_large", "Resumes must be 5 MB or smaller.", 413);
  }
  const stored = await writePrivateFile(userId, file.buffer);
  let parsed;
  try {
    parsed = await parseResumeFile(file);
  } catch (error) {
    await deletePrivateFile(stored.storageKey);
    throw error;
  }
  const documentId = stored.documentId;
  await db.insert(resumeDocument).values({
    id: documentId,
    userId,
    kind: "source",
    originalFilename: file.filename.replace(/[/\\]/g, "").slice(0, 180),
    mimeType: file.mimeType.slice(0, 120),
    byteSize: file.buffer.length,
    storageKey: stored.storageKey,
    sha256: stored.sha256,
    parseStatus: parsed.likelyScanned ? "needs_ocr" : "pending_review",
    parseResult: {
      kind: parsed.kind,
      warnings: parsed.warnings,
      missingFields: parsed.missingFields,
      likelyScanned: parsed.likelyScanned,
      extractedChars: parsed.extractedChars,
      pageCount: parsed.pageCount,
      content: parsed.content,
    },
  });
  return {
    documentId,
    filename: file.filename.replace(/[/\\]/g, "").slice(0, 180),
    kind: parsed.kind,
    warnings: parsed.warnings,
    missingFields: parsed.missingFields,
    likelyScanned: parsed.likelyScanned,
    extractedChars: parsed.extractedChars,
    pageCount: parsed.pageCount,
    content: parsed.content,
    fieldConfidence: parsed.fieldConfidence,
  };
}

export async function getParseDraft(db: HireFlowDb, userId: string, documentId: string) {
  const doc = await db.query.resumeDocument.findFirst({
    where: and(eq(resumeDocument.id, documentId), eq(resumeDocument.userId, userId)),
  });
  if (!doc) throw new ResumeError("not_found", "Uploaded document not found.", 404);
  const result = (doc.parseResult ?? {}) as Record<string, unknown>;
  return {
    documentId: doc.id,
    filename: doc.originalFilename,
    parseStatus: doc.parseStatus,
    content: result.content,
    warnings: result.warnings,
    missingFields: result.missingFields,
    likelyScanned: result.likelyScanned,
  };
}

export async function confirmParsedResume(
  db: HireFlowDb,
  userId: string,
  input: {
    documentId: string;
    content: StructuredResume;
    title?: string;
    copyConfirmedFieldsToProfile?: boolean;
  },
) {
  await assertEntitlement(userId, "resumes.parse_export");
  const used = await countResumes(db, userId);
  await assertEntitlement(userId, "resumes.max_versions", { used, increment: 1 });
  const doc = await db.query.resumeDocument.findFirst({
    where: and(eq(resumeDocument.id, input.documentId), eq(resumeDocument.userId, userId)),
  });
  if (!doc) throw new ResumeError("not_found", "Uploaded document not found.", 404);
  const content = structuredResumeSchema.parse(input.content);
  const id = randomUUID();
  await db.insert(resume).values({
    id,
    userId,
    title: input.title?.trim() || content.personal.fullName || "Uploaded resume",
    originKind: "uploaded",
    sourceDocumentId: doc.id,
    confirmedAt: new Date(),
  });
  const versionId = await insertVersion(db, {
    resumeId: id,
    userId,
    content,
    templateId: "professional-classic",
    notes: "Original uploaded resume",
    isOriginal: true,
  });
  await db
    .update(resume)
    .set({ originalVersionId: versionId, currentVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(resume.id, id), eq(resume.userId, userId)));
  await db
    .update(resumeDocument)
    .set({ resumeId: id, parseStatus: "confirmed" })
    .where(and(eq(resumeDocument.id, doc.id), eq(resumeDocument.userId, userId)));

  if (input.copyConfirmedFieldsToProfile) {
    const existing = await db.query.profile.findFirst({ where: eq(profile.userId, userId) });
    if (existing) {
      await db
        .update(profile)
        .set({
          headline: content.personal.headline || existing.headline,
          summary: content.personal.summary || existing.summary,
          location: content.personal.location || existing.location,
          skills: content.skills.flatMap((group) => group.items).slice(0, 40),
          updatedAt: new Date(),
        })
        .where(eq(profile.userId, userId));
    }
  }
  return getResume(db, userId, id);
}

export async function getResume(db: HireFlowDb, userId: string, resumeId: string) {
  const { row, version, content } = await currentContent(db, userId, resumeId);
  const versions = await db
    .select()
    .from(resumeVersion)
    .where(and(eq(resumeVersion.resumeId, resumeId), eq(resumeVersion.userId, userId)))
    .orderBy(desc(resumeVersion.versionNumber));
  return {
    resume: {
      id: row.id,
      title: row.title,
      originKind: row.originKind,
      templateId: row.templateId,
      targetJobId: row.targetJobId,
      parentResumeId: row.parentResumeId,
      originalVersionId: row.originalVersionId,
      currentVersionId: row.currentVersionId,
      confirmedAt: row.confirmedAt,
      updatedAt: row.updatedAt,
    },
    content,
    versions: versions.map((item) => ({
      id: item.id,
      versionNumber: item.versionNumber,
      notes: item.notes,
      isOriginal: item.isOriginal,
      createdAt: item.createdAt,
      templateId: item.templateId,
    })),
  };
}

export async function saveResumeContent(
  db: HireFlowDb,
  userId: string,
  resumeId: string,
  input: { content: StructuredResume; templateId?: ResumeTemplateId; title?: string },
) {
  const { row, version } = await currentContent(db, userId, resumeId);
  const content = structuredResumeSchema.parse(input.content);
  const templateId = input.templateId ?? (row.templateId as ResumeTemplateId);
  if (version.isOriginal) {
    const workingId = await insertVersion(db, {
      resumeId,
      userId,
      content,
      templateId,
      notes: "Working copy",
    });
    await db
      .update(resume)
      .set({
        currentVersionId: workingId,
        templateId,
        title: input.title?.trim() || row.title,
        updatedAt: new Date(),
      })
      .where(and(eq(resume.id, resumeId), eq(resume.userId, userId)));
  } else {
    await db
      .update(resumeVersion)
      .set({ content, templateId })
      .where(and(eq(resumeVersion.id, version.id), eq(resumeVersion.userId, userId)));
    await db
      .update(resume)
      .set({
        templateId,
        title: input.title?.trim() || row.title,
        updatedAt: new Date(),
      })
      .where(and(eq(resume.id, resumeId), eq(resume.userId, userId)));
  }
  return getResume(db, userId, resumeId);
}

export async function snapshotResume(db: HireFlowDb, userId: string, resumeId: string, notes?: string) {
  const { row, content } = await currentContent(db, userId, resumeId);
  const versions = await db.query.resumeVersion.findMany({
    where: and(eq(resumeVersion.resumeId, resumeId), eq(resumeVersion.userId, userId)),
  });
  if (versions.length >= 10) {
    throw new ResumeError("too_many_snapshots", "This resume already has the maximum number of snapshots.", 429);
  }
  const versionId = await insertVersion(db, {
    resumeId,
    userId,
    content,
    templateId: row.templateId,
    notes: notes?.trim() || `Snapshot ${new Date().toISOString().slice(0, 10)}`,
  });
  await db
    .update(resume)
    .set({ currentVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(resume.id, resumeId), eq(resume.userId, userId)));
  return getResume(db, userId, resumeId);
}

export async function restoreResumeVersion(db: HireFlowDb, userId: string, resumeId: string, versionId: string) {
  const { row } = await currentContent(db, userId, resumeId);
  const source = await db.query.resumeVersion.findFirst({
    where: and(eq(resumeVersion.id, versionId), eq(resumeVersion.resumeId, resumeId), eq(resumeVersion.userId, userId)),
  });
  if (!source) throw new ResumeError("not_found", "Version not found.", 404);
  const content = asContent(source.content);
  const newId = await insertVersion(db, {
    resumeId,
    userId,
    content,
    templateId: source.templateId,
    notes: `Restored from v${source.versionNumber}`,
  });
  await db
    .update(resume)
    .set({ currentVersionId: newId, templateId: source.templateId, updatedAt: new Date() })
    .where(and(eq(resume.id, row.id), eq(resume.userId, userId)));
  return getResume(db, userId, resumeId);
}

export async function duplicateResume(db: HireFlowDb, userId: string, resumeId: string) {
  const used = await countResumes(db, userId);
  await assertEntitlement(userId, "resumes.max_versions", { used, increment: 1 });
  const { row, content } = await currentContent(db, userId, resumeId);
  const id = randomUUID();
  await db.insert(resume).values({
    id,
    userId,
    title: `${row.title} copy`,
    originKind: "duplicated",
    templateId: row.templateId,
    parentResumeId: row.id,
    confirmedAt: new Date(),
  });
  const versionId = await insertVersion(db, {
    resumeId: id,
    userId,
    content,
    templateId: row.templateId,
    notes: "Duplicated original",
    isOriginal: true,
  });
  await db
    .update(resume)
    .set({ originalVersionId: versionId, currentVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(resume.id, id), eq(resume.userId, userId)));
  return getResume(db, userId, id);
}

export async function deleteResume(db: HireFlowDb, userId: string, resumeId: string) {
  await ownedResume(db, userId, resumeId);
  await db
    .update(resume)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(resume.id, resumeId), eq(resume.userId, userId)));
  return { ok: true };
}

export async function analyzeResumeForUser(db: HireFlowDb, userId: string, resumeId: string) {
  const { row, version, content } = await currentContent(db, userId, resumeId);
  const result = analyzeResume(content);
  const id = randomUUID();
  await db.insert(resumeAnalysis).values({
    id,
    userId,
    resumeId: row.id,
    versionId: version.id,
    completeness: result.completeness,
    scoreDefinition: result.scoreDefinition,
    findings: result.findings,
  });
  return result;
}

export async function matchResumeJob(db: HireFlowDb, userId: string, resumeId: string, jobId: string) {
  const { row, version, content } = await currentContent(db, userId, resumeId);
  const job = await getJobForUser(db, userId, jobId);
  if (!job) throw new ResumeError("not_found", "Job not found.", 404);
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, userId) });
  const breakdown = matchResumeToJob(content, job, {
    workplacePreference: p?.workplacePreference,
    employmentTypes: p?.employmentTypes ?? [],
    experienceLevel: p?.experienceLevel,
  });
  await db.insert(resumeJobMatch).values({
    id: randomUUID(),
    userId,
    resumeId: row.id,
    versionId: version.id,
    jobId: job.id,
    overall: breakdown.overall,
    breakdown,
  });
  return {
    job: { id: job.id, title: job.title, companyName: job.companyName },
    match: breakdown,
    pack: applicationPackForJob({ jobId: job.id, resumeId: row.id }),
  };
}

export async function startTailoring(db: HireFlowDb, userId: string, resumeId: string, jobId: string) {
  await assertEntitlement(userId, "resume.tailoring");
  const { row, version, content } = await currentContent(db, userId, resumeId);
  const job = await getJobForUser(db, userId, jobId);
  if (!job) throw new ResumeError("not_found", "Job not found.", 404);
  const plan = buildTailorPlan(content, job);
  const settings = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) });
  if (settings?.aiExternalConsent) {
    try {
      const llm = await completeAiTask({
        db,
        userId,
        feature: "resume.phrasing",
        payloadClass: "sensitive",
        needsLlm: true,
        prompt: wrapUntrusted(
          JSON.stringify({
            summary: content.personal.summary,
            bullets: content.experience.flatMap((row) => row.responsibilities).slice(0, 8),
            jobTitle: job.title,
          }),
          "resume",
        ),
        schema: phrasingSuggestionSchema,
        consent: {
          aiExternalConsent: settings.aiExternalConsent,
          aiPaidConsent: settings.aiPaidConsent,
        },
      });
      if (llm.status === "success" && llm.data) {
        const hay = JSON.stringify(content).toLowerCase();
        for (const row of llm.data.suggestions) {
          if (!row.before?.trim() || !row.after?.trim()) continue;
          if (!hay.includes(row.before.toLowerCase().slice(0, 80))) continue;
          plan.suggestions.push({
            id: randomUUID(),
            kind: "bullet_clarity",
            path: row.path || "personal.summary",
            before: row.before,
            after: row.after,
            rationale: row.rationale,
            invented: false,
          });
        }
      } else if (llm.status === "quota") {
        plan.warnings.push(llm.message ?? "Monthly local phrasing assist limit reached.");
      } else if (llm.message) {
        plan.warnings.push(llm.message);
      }
    } catch {
      plan.warnings.push("Local model not available.");
    }
  }
  const id = randomUUID();
  await db.insert(resumeTailoringSession).values({
    id,
    userId,
    resumeId: row.id,
    sourceVersionId: version.id,
    jobId: job.id,
    suggestions: { suggestions: plan.suggestions, warnings: plan.warnings },
    status: "draft",
  });
  return {
    sessionId: id,
    resumeId: row.id,
    job: { id: job.id, title: job.title, companyName: job.companyName },
    suggestions: plan.suggestions,
    warnings: plan.warnings,
    sourceContent: content,
  };
}

export async function applyTailoring(
  db: HireFlowDb,
  userId: string,
  sessionId: string,
  decisions: Record<string, TailorDecision>,
  edits?: Record<string, string>,
) {
  await assertEntitlement(userId, "resume.tailoring");
  const session = await db.query.resumeTailoringSession.findFirst({
    where: and(eq(resumeTailoringSession.id, sessionId), eq(resumeTailoringSession.userId, userId)),
  });
  if (!session) throw new ResumeError("not_found", "Tailoring session not found.", 404);
  const { row, content } = await currentContent(db, userId, session.resumeId);
  const stored = session.suggestions as {
    suggestions?: ReturnType<typeof buildTailorPlan>["suggestions"];
    warnings?: string[];
  } | ReturnType<typeof buildTailorPlan>["suggestions"];
  const suggestions = Array.isArray(stored) ? stored : stored?.suggestions ?? [];
  const tailored = applyTailorDecisions(content, suggestions, decisions, edits);
  assertNoFabrication(content, tailored);
  const used = await countResumes(db, userId);
  await assertEntitlement(userId, "resumes.max_versions", { used, increment: 1 });
  const job = await getJobForUser(db, userId, session.jobId);
  const id = randomUUID();
  const title = job ? `${row.title} · ${job.title}` : `${row.title} tailored`;
  await db.insert(resume).values({
    id,
    userId,
    title: title.slice(0, 120),
    originKind: "tailored",
    templateId: row.templateId,
    parentResumeId: row.id,
    targetJobId: session.jobId,
    confirmedAt: new Date(),
  });
  const versionId = await insertVersion(db, {
    resumeId: id,
    userId,
    content: tailored,
    templateId: row.templateId,
    notes: "Job-specific version from accepted suggestions",
    isOriginal: true,
  });
  await db
    .update(resume)
    .set({ originalVersionId: versionId, currentVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(resume.id, id), eq(resume.userId, userId)));
  await db
    .update(resumeTailoringSession)
    .set({ decisions, resultResumeId: id, status: "applied", updatedAt: new Date() })
    .where(and(eq(resumeTailoringSession.id, sessionId), eq(resumeTailoringSession.userId, userId)));
  return getResume(db, userId, id);
}

export async function exportResumeFile(
  db: HireFlowDb,
  userId: string,
  resumeId: string,
  format: "pdf" | "docx",
) {
  await assertEntitlement(userId, "resumes.parse_export");
  const { row, version, content } = await currentContent(db, userId, resumeId);
  const templateId = row.templateId as ResumeTemplateId;
  const bytes =
    format === "pdf"
      ? await (await import("./export/pdf")).exportResumePdf(content, templateId)
      : await (await import("./export/docx")).exportResumeDocx(content, templateId);
  const stored = await writePrivateFile(userId, bytes);
  const documentId = stored.documentId;
  await db.insert(resumeDocument).values({
    id: documentId,
    userId,
    resumeId: row.id,
    kind: format === "pdf" ? "export_pdf" : "export_docx",
    originalFilename: `${row.title.replace(/[^\w\s-]+/g, "").slice(0, 80) || "resume"}.${format}`,
    mimeType:
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    byteSize: bytes.length,
    storageKey: stored.storageKey,
    sha256: stored.sha256,
    parseStatus: "export",
  });
  await db.insert(resumeExport).values({
    id: randomUUID(),
    userId,
    resumeId: row.id,
    versionId: version.id,
    documentId,
    format,
    templateId,
  });
  return {
    documentId,
    filename: `${row.title.replace(/[^\w\s-]+/g, "").slice(0, 80) || "resume"}.${format}`,
    mimeType:
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    byteSize: bytes.length,
  };
}

export async function readOwnedDocument(db: HireFlowDb, userId: string, documentId: string) {
  const doc = await db.query.resumeDocument.findFirst({
    where: and(eq(resumeDocument.id, documentId), eq(resumeDocument.userId, userId)),
  });
  if (!doc) throw new ResumeError("not_found", "Document not found.", 404);
  const bytes = await readPrivateFile(userId, doc.storageKey);
  return { doc, bytes };
}

export async function listResumeDocuments(db: HireFlowDb, userId: string, resumeId: string) {
  await ownedResume(db, userId, resumeId);
  const rows = await db.query.resumeDocument.findMany({
    where: and(eq(resumeDocument.userId, userId), eq(resumeDocument.resumeId, resumeId)),
  });
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
    createdAt: row.createdAt,
  }));
}

export async function purgeUserResumeFiles(userId: string) {
  await deleteUserUploadDir(userId);
}

export { analyzeResume, buildTailorPlan, parseResumeFile };
