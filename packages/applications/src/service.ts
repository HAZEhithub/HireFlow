import { randomUUID } from "node:crypto";
import {
  application,
  applicationEvent,
  applicationPackItem,
  careerEvidence,
  followUp,
  notification,
  resume,
  resumeVersion,
  type HireFlowDb,
} from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import { getJobForUser, isSafeApplyHref } from "@hireflow/jobs";
import {
  APPLICATION_STAGES,
  applicationPatchSchema,
  applicationWriteSchema,
  evidenceWriteSchema,
  followUpWriteSchema,
  packItemWriteSchema,
} from "@hireflow/shared";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ApplicationError } from "./errors";
import { applicationPackForJob } from "./pack";

type ApplicationStage = (typeof APPLICATION_STAGES)[number];

function asStage(value: string | undefined, fallback: ApplicationStage = "saved"): ApplicationStage {
  return (APPLICATION_STAGES as readonly string[]).includes(value ?? "")
    ? (value as ApplicationStage)
    : fallback;
}

async function ownedApplication(db: HireFlowDb, userId: string, id: string) {
  const row = await db.query.application.findFirst({
    where: and(eq(application.id, id), eq(application.userId, userId)),
  });
  if (!row) throw new ApplicationError("not_found", "Application not found.", 404);
  return row;
}

async function assertOwnedResumeVersion(db: HireFlowDb, userId: string, versionId: string | null | undefined) {
  if (!versionId) return null;
  const version = await db.query.resumeVersion.findFirst({
    where: and(eq(resumeVersion.id, versionId), eq(resumeVersion.userId, userId)),
  });
  if (!version) throw new ApplicationError("not_found", "Resume version not found.", 404);
  const parent = await db.query.resume.findFirst({
    where: and(eq(resume.id, version.resumeId), eq(resume.userId, userId), isNull(resume.deletedAt)),
  });
  if (!parent) throw new ApplicationError("not_found", "Resume version not found.", 404);
  return version;
}

async function writeStageEvent(
  db: HireFlowDb,
  input: { applicationId: string; userId: string; fromStage: string | null; toStage: string },
) {
  await db.insert(applicationEvent).values({
    id: randomUUID(),
    applicationId: input.applicationId,
    userId: input.userId,
    fromStage: input.fromStage,
    toStage: input.toStage,
    at: new Date(),
  });
}

export async function listApplications(db: HireFlowDb, userId: string, stage?: string) {
  await assertEntitlement(userId, "applications.tracker");
  const filters = [eq(application.userId, userId)];
  if (stage && (APPLICATION_STAGES as readonly string[]).includes(stage)) {
    filters.push(eq(application.stage, stage));
  }
  return db
    .select()
    .from(application)
    .where(and(...filters))
    .orderBy(desc(application.updatedAt));
}

export async function getApplication(db: HireFlowDb, userId: string, id: string) {
  await assertEntitlement(userId, "applications.tracker");
  const row = await ownedApplication(db, userId, id);
  const events = await db
    .select()
    .from(applicationEvent)
    .where(and(eq(applicationEvent.applicationId, id), eq(applicationEvent.userId, userId)))
    .orderBy(desc(applicationEvent.at));
  const followUps = await db
    .select()
    .from(followUp)
    .where(and(eq(followUp.applicationId, id), eq(followUp.userId, userId)))
    .orderBy(desc(followUp.dueAt));
  const packItems = await db
    .select()
    .from(applicationPackItem)
    .where(and(eq(applicationPackItem.applicationId, id), eq(applicationPackItem.userId, userId)));
  return { application: row, events, followUps, pack: applicationPackForJob({ applicationId: id, jobId: row.jobId }), packItems };
}

export async function createApplication(db: HireFlowDb, userId: string, input: unknown) {
  await assertEntitlement(userId, "applications.tracker");
  const parsed = applicationWriteSchema.safeParse(input);
  if (!parsed.success) throw new ApplicationError("invalid", "Check company, title, and stage.", 400);
  const data = parsed.data;
  let companyName = data.companyName?.trim() || "";
  let title = data.title?.trim() || "";
  let applyUrl = data.applyUrl || null;
  let source = data.source ?? "manual";
  if (data.jobId) {
    const job = await getJobForUser(db, userId, data.jobId);
    if (!job) throw new ApplicationError("not_found", "Job not found.", 404);
    companyName = job.companyName || companyName;
    title = job.title || title;
    applyUrl = applyUrl || job.applyUrl;
    source = data.source ?? (job.listingKind === "user_import" ? "user_import" : "discover");
  }
  if (!companyName || !title) {
    throw new ApplicationError("invalid", "Company and title are required.", 400);
  }
  if (applyUrl && !isSafeApplyHref(applyUrl)) {
    throw new ApplicationError("invalid", "Apply URLs must be public http(s) links.", 400);
  }
  await assertOwnedResumeVersion(db, userId, data.resumeVersionId);
  const id = randomUUID();
  const stage = asStage(data.stage);
  const now = new Date();
  const row = {
    id,
    userId,
    jobId: data.jobId || null,
    companyName,
    title,
    stage,
    source,
    resumeVersionId: data.resumeVersionId || null,
    notes: data.notes || null,
    applyUrl,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(application).values(row);
  await writeStageEvent(db, { applicationId: id, userId, fromStage: null, toStage: stage });
  return row;
}

export async function updateApplication(db: HireFlowDb, userId: string, id: string, input: unknown) {
  await assertEntitlement(userId, "applications.tracker");
  const existing = await ownedApplication(db, userId, id);
  const parsed = applicationPatchSchema.safeParse(input);
  if (!parsed.success) throw new ApplicationError("invalid", "Check the application fields.", 400);
  const data = parsed.data;
  if (data.resumeVersionId !== undefined) {
    await assertOwnedResumeVersion(db, userId, data.resumeVersionId);
  }
  const nextStage = data.stage ? asStage(data.stage, existing.stage as ApplicationStage) : (existing.stage as ApplicationStage);
  let applyUrl = data.applyUrl === undefined ? existing.applyUrl : data.applyUrl || null;
  if (applyUrl && !isSafeApplyHref(applyUrl)) {
    throw new ApplicationError("invalid", "Apply URLs must be public http(s) links.", 400);
  }
  await db
    .update(application)
    .set({
      companyName: data.companyName ?? existing.companyName,
      title: data.title ?? existing.title,
      stage: nextStage,
      source: data.source ?? existing.source,
      resumeVersionId: data.resumeVersionId === undefined ? existing.resumeVersionId : data.resumeVersionId || null,
      notes: data.notes === undefined ? existing.notes : data.notes,
      applyUrl,
      updatedAt: new Date(),
    })
    .where(and(eq(application.id, id), eq(application.userId, userId)));
  if (nextStage !== existing.stage) {
    await writeStageEvent(db, { applicationId: id, userId, fromStage: existing.stage, toStage: nextStage });
  }
  return getApplication(db, userId, id);
}

export async function deleteApplication(db: HireFlowDb, userId: string, id: string) {
  await assertEntitlement(userId, "applications.tracker");
  await ownedApplication(db, userId, id);
  await db
    .delete(notification)
    .where(and(eq(notification.userId, userId), eq(notification.href, `/applications/${id}`)));
  await db.delete(application).where(and(eq(application.id, id), eq(application.userId, userId)));
}

export async function createFollowUp(db: HireFlowDb, userId: string, applicationId: string, input: unknown) {
  await assertEntitlement(userId, "applications.follow_ups");
  const row = await ownedApplication(db, userId, applicationId);
  const parsed = followUpWriteSchema.safeParse(input);
  if (!parsed.success) throw new ApplicationError("invalid", "A follow-up needs a due date.", 400);
  const dueAt = new Date(parsed.data.dueAt);
  if (Number.isNaN(dueAt.getTime())) throw new ApplicationError("invalid", "Due date is not valid.", 400);
  const id = randomUUID();
  const title = parsed.data.title?.trim() || `Follow up: ${row.companyName}`;
  await db.insert(followUp).values({
    id,
    applicationId,
    userId,
    title,
    body: parsed.data.body ?? null,
    dueAt,
  });
  await db.insert(notification).values({
    id: randomUUID(),
    userId,
    type: "follow_up",
    title,
    body: `Follow-up note for ${row.title} at ${row.companyName}. Due ${dueAt.toISOString().slice(0, 10)}. HireFlow will not send this application.`,
    href: `/applications/${applicationId}`,
  });
  return { id, dueAt, title };
}

export async function completeFollowUp(db: HireFlowDb, userId: string, followUpId: string) {
  await assertEntitlement(userId, "applications.follow_ups");
  const updated = await db
    .update(followUp)
    .set({ doneAt: new Date() })
    .where(and(eq(followUp.id, followUpId), eq(followUp.userId, userId)))
    .returning({ id: followUp.id });
  if (updated.length === 0) throw new ApplicationError("not_found", "Follow-up not found.", 404);
  return { ok: true as const };
}

export async function listEvidence(db: HireFlowDb, userId: string) {
  await assertEntitlement(userId, "evidence.vault_items", { used: 0, increment: 0 });
  return db
    .select()
    .from(careerEvidence)
    .where(eq(careerEvidence.userId, userId))
    .orderBy(desc(careerEvidence.updatedAt));
}

export async function createEvidence(db: HireFlowDb, userId: string, input: unknown) {
  const existing = await listEvidence(db, userId);
  await assertEntitlement(userId, "evidence.vault_items", { used: existing.length, increment: 1 });
  const parsed = evidenceWriteSchema.safeParse(input);
  if (!parsed.success) throw new ApplicationError("invalid", "Evidence needs a kind and title you provided.", 400);
  const url = parsed.data.url || null;
  if (url && !isSafeApplyHref(url)) {
    throw new ApplicationError("invalid", "Evidence URLs must be public http(s) links.", 400);
  }
  const id = randomUUID();
  const now = new Date();
  const row = {
    id,
    userId,
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body ?? null,
    url,
    quotedAs: "user-provided",
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(careerEvidence).values(row);
  return row;
}

export async function deleteEvidence(db: HireFlowDb, userId: string, id: string) {
  await assertEntitlement(userId, "evidence.vault_items", { used: 0, increment: 0 });
  const deleted = await db
    .delete(careerEvidence)
    .where(and(eq(careerEvidence.id, id), eq(careerEvidence.userId, userId)))
    .returning({ id: careerEvidence.id });
  if (deleted.length === 0) throw new ApplicationError("not_found", "Evidence item not found.", 404);
}

export async function upsertPackItem(db: HireFlowDb, userId: string, applicationId: string, input: unknown) {
  await assertEntitlement(userId, "applications.pack");
  await ownedApplication(db, userId, applicationId);
  const parsed = packItemWriteSchema.safeParse(input);
  if (!parsed.success) throw new ApplicationError("invalid", "Pack items need a slot and your own text.", 400);
  const now = new Date();
  const row = {
    id: randomUUID(),
    userId,
    applicationId,
    slot: parsed.data.slot,
    body: parsed.data.body,
    source: "user_paste",
    createdAt: now,
    updatedAt: now,
  };
  await db
    .insert(applicationPackItem)
    .values(row)
    .onConflictDoUpdate({
      target: [applicationPackItem.applicationId, applicationPackItem.slot],
      set: {
        body: parsed.data.body,
        source: "user_paste",
        updatedAt: now,
        userId,
      },
    });
  const saved = await db.query.applicationPackItem.findFirst({
    where: and(
      eq(applicationPackItem.applicationId, applicationId),
      eq(applicationPackItem.userId, userId),
      eq(applicationPackItem.slot, parsed.data.slot),
    ),
  });
  return saved ?? row;
}

export async function exportWorkspace(db: HireFlowDb, userId: string) {
  const applications = await db.select().from(application).where(eq(application.userId, userId));
  const events = await db.select().from(applicationEvent).where(eq(applicationEvent.userId, userId));
  const followUps = await db.select().from(followUp).where(eq(followUp.userId, userId));
  const evidence = await db.select().from(careerEvidence).where(eq(careerEvidence.userId, userId));
  const packItems = await db.select().from(applicationPackItem).where(eq(applicationPackItem.userId, userId));
  return { applications, events, followUps, evidence, packItems };
}

export async function listResumeVersionOptions(db: HireFlowDb, userId: string) {
  const versions = await db
    .select({
      id: resumeVersion.id,
      resumeId: resumeVersion.resumeId,
      versionNumber: resumeVersion.versionNumber,
      title: resume.title,
    })
    .from(resumeVersion)
    .innerJoin(resume, eq(resume.id, resumeVersion.resumeId))
    .where(and(eq(resumeVersion.userId, userId), eq(resume.userId, userId), isNull(resume.deletedAt)))
    .orderBy(desc(resumeVersion.createdAt));
  return versions;
}
