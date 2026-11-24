"use server";

import { getDb } from "@hireflow/db";
import { ResumeError } from "@hireflow/resumes";
import {
  applyTailoring,
  analyzeResumeForUser,
  confirmParsedResume,
  createBlankResume,
  deleteResume,
  duplicateResume,
  exportResumeFile,
  matchResumeJob,
  parseUploadedResume,
  restoreResumeVersion,
  saveResumeContent,
  snapshotResume,
  startTailoring,
} from "@hireflow/resumes";
import { structuredResumeSchema, type ResumeTemplateId, type StructuredResume } from "@hireflow/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/session";

function revalidateResume(id?: string) {
  revalidatePath("/resumes");
  if (id) {
    revalidatePath(`/resumes/${id}`);
    revalidatePath(`/resumes/${id}/analysis`);
    revalidatePath(`/resumes/${id}/templates`);
    revalidatePath(`/resumes/${id}/export`);
    revalidatePath(`/resumes/${id}/versions`);
  }
}

export async function createResumeAction(formData: FormData) {
  const user = await requireUser();
  const db = await getDb();
  const created = await createBlankResume(db, user.id, String(formData.get("title") ?? "Untitled resume"));
  revalidateResume(created.resume.id);
  redirect(`/resumes/${created.resume.id}`);
}

export async function parseResumeAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new ResumeError("file_required", "Choose a PDF, DOCX, or TXT file.", 400);
  }
  const db = await getDb();
  const parsed = await parseUploadedResume(db, user.id, {
    buffer: Buffer.from(await file.arrayBuffer()),
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
  });
  redirect(`/resumes/review/${parsed.documentId}`);
}

export async function confirmResumeAction(formData: FormData) {
  const user = await requireUser();
  const raw = String(formData.get("content") ?? "");
  const content = structuredResumeSchema.parse(JSON.parse(raw) as unknown);
  const db = await getDb();
  const created = await confirmParsedResume(db, user.id, {
    documentId: String(formData.get("documentId")),
    title: String(formData.get("title") ?? ""),
    content,
    copyConfirmedFieldsToProfile: formData.get("copyToProfile") === "on",
  });
  revalidateResume(created.resume.id);
  redirect(`/resumes/${created.resume.id}`);
}

export async function saveResumeAction(input: {
  resumeId: string;
  content: StructuredResume;
  templateId?: ResumeTemplateId;
  title?: string;
}) {
  const user = await requireUser();
  const db = await getDb();
  const saved = await saveResumeContent(db, user.id, input.resumeId, input);
  revalidateResume(input.resumeId);
  return { ok: true as const, updatedAt: saved.resume.updatedAt };
}

export async function snapshotResumeAction(formData: FormData) {
  const user = await requireUser();
  const resumeId = String(formData.get("resumeId"));
  const db = await getDb();
  await snapshotResume(db, user.id, resumeId, String(formData.get("notes") ?? ""));
  revalidateResume(resumeId);
}

export async function restoreVersionAction(formData: FormData) {
  const user = await requireUser();
  const resumeId = String(formData.get("resumeId"));
  const db = await getDb();
  await restoreResumeVersion(db, user.id, resumeId, String(formData.get("versionId")));
  revalidateResume(resumeId);
}

export async function duplicateResumeAction(formData: FormData) {
  const user = await requireUser();
  const db = await getDb();
  const copy = await duplicateResume(db, user.id, String(formData.get("resumeId")));
  revalidateResume(copy.resume.id);
  redirect(`/resumes/${copy.resume.id}`);
}

export async function deleteResumeAction(formData: FormData) {
  const user = await requireUser();
  const db = await getDb();
  await deleteResume(db, user.id, String(formData.get("resumeId")));
  revalidatePath("/resumes");
  redirect("/resumes");
}

export async function setTemplateAction(formData: FormData) {
  const user = await requireUser();
  const resumeId = String(formData.get("resumeId"));
  const db = await getDb();
  const { getResume } = await import("@hireflow/resumes");
  const current = await getResume(db, user.id, resumeId);
  await saveResumeContent(db, user.id, resumeId, {
    content: current.content,
    templateId: String(formData.get("templateId")) as ResumeTemplateId,
  });
  revalidateResume(resumeId);
}

export async function analyzeAction(resumeId: string) {
  const user = await requireUser();
  const db = await getDb();
  return analyzeResumeForUser(db, user.id, resumeId);
}

export async function exportResumeAction(formData: FormData) {
  const user = await requireUser();
  const resumeId = String(formData.get("resumeId"));
  const format = String(formData.get("format")) === "docx" ? "docx" : "pdf";
  const db = await getDb();
  const exported = await exportResumeFile(db, user.id, resumeId, format);
  revalidateResume(resumeId);
  redirect(`/api/resumes/documents/${exported.documentId}`);
}

export async function startTailorAction(formData: FormData) {
  const user = await requireUser();
  const db = await getDb();
  const session = await startTailoring(
    db,
    user.id,
    String(formData.get("resumeId")),
    String(formData.get("jobId")),
  );
  redirect(`/resumes/tailor/${session.sessionId}`);
}

export async function applyTailorAction(input: {
  sessionId: string;
  decisions: Record<string, "accept" | "reject" | "edit">;
  edits?: Record<string, string>;
}) {
  const user = await requireUser();
  const db = await getDb();
  const result = await applyTailoring(db, user.id, input.sessionId, input.decisions, input.edits);
  revalidateResume(result.resume.id);
  redirect(`/resumes/${result.resume.id}`);
}

export async function matchAction(resumeId: string, jobId: string) {
  const user = await requireUser();
  const db = await getDb();
  return matchResumeJob(db, user.id, resumeId, jobId);
}
