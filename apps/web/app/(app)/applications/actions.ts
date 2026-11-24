"use server";

import {
  ApplicationError,
  completeFollowUp,
  createApplication,
  createEvidence,
  createFollowUp,
  deleteApplication,
  deleteEvidence,
  updateApplication,
  upsertPackItem,
} from "@hireflow/applications";
import { rateLimit } from "@hireflow/config";
import { getDb } from "@hireflow/db";
import { EntitlementError } from "@hireflow/entitlements";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/session";

function revalidateWorkspace(id?: string) {
  revalidatePath("/applications");
  revalidatePath("/");
  revalidatePath("/notifications");
  revalidatePath("/evidence");
  if (id) revalidatePath(`/applications/${id}`);
}

function failTo(path: string, error: unknown): never {
  const message =
    error instanceof ApplicationError || error instanceof EntitlementError
      ? error.message
      : "Something went wrong. Try again.";
  const url = `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`;
  redirect(url);
}

function assertWriteBudget(userId: string) {
  const limited = rateLimit({ key: `applications:write:${userId}`, limit: 60, windowMs: 60_000 });
  if (!limited.ok) {
    throw new ApplicationError("rate_limited", "Too many workspace writes. Wait a minute and try again.", 429);
  }
}

export async function createApplicationAction(formData: FormData) {
  const user = await requireUser();
  let id: string;
  try {
    assertWriteBudget(user.id);
    const db = await getDb();
    const applyUrl = String(formData.get("applyUrl") ?? "").trim();
    const row = await createApplication(db, user.id, {
      jobId: String(formData.get("jobId") ?? "") || null,
      companyName: String(formData.get("companyName") ?? ""),
      title: String(formData.get("title") ?? ""),
      stage: String(formData.get("stage") || "saved"),
      source: String(formData.get("source") || "manual"),
      resumeVersionId: String(formData.get("resumeVersionId") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      applyUrl: applyUrl || null,
    });
    id = row.id;
  } catch (error) {
    failTo("/applications/new", error);
  }
  revalidateWorkspace(id);
  redirect(`/applications/${id}`);
}

export async function updateApplicationAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  try {
    assertWriteBudget(user.id);
    const db = await getDb();
    await updateApplication(db, user.id, id, {
      companyName: String(formData.get("companyName") ?? "") || undefined,
      title: String(formData.get("title") ?? "") || undefined,
      stage: String(formData.get("stage") ?? "") || undefined,
      resumeVersionId: String(formData.get("resumeVersionId") ?? "") || null,
      notes: String(formData.get("notes") ?? ""),
      applyUrl: String(formData.get("applyUrl") ?? "") || null,
    });
  } catch (error) {
    failTo(`/applications/${id}`, error);
  }
  revalidateWorkspace(id);
}

export async function deleteApplicationAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  try {
    assertWriteBudget(user.id);
    const db = await getDb();
    await deleteApplication(db, user.id, id);
  } catch (error) {
    failTo(`/applications/${id}`, error);
  }
  revalidateWorkspace();
  redirect("/applications");
}

export async function createFollowUpAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("applicationId") ?? "");
  try {
    assertWriteBudget(user.id);
    const db = await getDb();
    await createFollowUp(db, user.id, applicationId, {
      dueAt: String(formData.get("dueAt") ?? ""),
      title: String(formData.get("title") ?? "") || undefined,
      body: String(formData.get("body") ?? "") || null,
    });
  } catch (error) {
    failTo(`/applications/${applicationId}`, error);
  }
  revalidateWorkspace(applicationId);
}

export async function completeFollowUpAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  try {
    assertWriteBudget(user.id);
    const db = await getDb();
    await completeFollowUp(db, user.id, id);
  } catch (error) {
    failTo(`/applications/${applicationId}`, error);
  }
  revalidateWorkspace(applicationId);
}

export async function savePackItemAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("applicationId") ?? "");
  try {
    assertWriteBudget(user.id);
    const db = await getDb();
    await upsertPackItem(db, user.id, applicationId, {
      slot: String(formData.get("slot") ?? ""),
      body: String(formData.get("body") ?? ""),
    });
  } catch (error) {
    failTo(`/applications/${applicationId}`, error);
  }
  revalidateWorkspace(applicationId);
}

export async function createEvidenceAction(formData: FormData) {
  const user = await requireUser();
  try {
    assertWriteBudget(user.id);
    const db = await getDb();
    await createEvidence(db, user.id, {
      kind: String(formData.get("kind") ?? "other"),
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? "") || null,
      url: String(formData.get("url") ?? "") || null,
    });
  } catch (error) {
    failTo("/evidence", error);
  }
  revalidatePath("/evidence");
}

export async function deleteEvidenceAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  try {
    assertWriteBudget(user.id);
    const db = await getDb();
    await deleteEvidence(db, user.id, id);
  } catch (error) {
    failTo("/evidence", error);
  }
  revalidatePath("/evidence");
}
