"use server";

import { rateLimit } from "@hireflow/config";
import { decrementUsagePeriod, getDb } from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import {
  claimUrlImportQuota,
  getJobForUser,
  importUserJob,
  saveJobForUser,
  stableId,
  unsaveJobForUser,
  upsertCanonicalJobs,
} from "@hireflow/jobs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/session";

export async function saveJobAction(formData: FormData) {
  const user = await requireUser();
  await assertEntitlement(user.id, "jobs.save");
  const jobId = String(formData.get("jobId") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 2000);
  const db = await getDb();
  const row = await getJobForUser(db, user.id, jobId);
  if (!row) throw new Error("Job not found.");
  await saveJobForUser(db, user.id, jobId, notes || undefined);
  revalidatePath("/jobs");
  revalidatePath("/jobs/saved");
  revalidatePath(`/jobs/${jobId}`);
}

export async function unsaveJobAction(formData: FormData) {
  const user = await requireUser();
  await assertEntitlement(user.id, "jobs.save");
  const jobId = String(formData.get("jobId") ?? "");
  const db = await getDb();
  await unsaveJobForUser(db, user.id, jobId);
  revalidatePath("/jobs");
  revalidatePath("/jobs/saved");
  revalidatePath(`/jobs/${jobId}`);
}

export async function importJobAction(formData: FormData) {
  const user = await requireUser();
  const limited = rateLimit({ key: `import:user:${user.id}`, limit: 20, windowMs: 60 * 60_000 });
  if (!limited.ok) {
    redirect(`/jobs/import?error=${encodeURIComponent("Too many imports. Try again later.")}`);
  }
  const db = await getDb();
  const applyUrl = String(formData.get("applyUrl") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!applyUrl || !title || !companyName) {
    redirect(`/jobs/import?error=${encodeURIComponent("Apply URL, title, and company are required.")}`);
  }
  await claimUrlImportQuota(db, user.id);
  try {
    const imported = await importUserJob(
      {
        applyUrl,
        title,
        companyName,
        descriptionText: String(formData.get("descriptionText") ?? ""),
        location: String(formData.get("location") ?? "") || undefined,
        employmentType: String(formData.get("employmentType") ?? "") || undefined,
        workplaceType: String(formData.get("workplaceType") ?? "") || undefined,
        salaryMin: formData.get("salaryMin") ? Number(formData.get("salaryMin")) : null,
        salaryMax: formData.get("salaryMax") ? Number(formData.get("salaryMax")) : null,
        salaryCurrency: String(formData.get("salaryCurrency") ?? "") || undefined,
        notes: String(formData.get("notes") ?? "") || undefined,
        extractMetadata: formData.get("extractMetadata") === "on",
      },
      { userId: user.id },
    );
    await upsertCanonicalJobs(db, [imported.job]);
    const stored = await getJobForUser(
      db,
      user.id,
      stableId(["job", imported.job.source, imported.job.boardId ?? "", imported.job.externalId]),
    );
    revalidatePath("/jobs");
    revalidatePath("/jobs/saved");
    if (stored) redirect(`/jobs/${stored.id}`);
    redirect(`/jobs/import?error=${encodeURIComponent("The listing could not be saved. Check the URL and try again.")}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      const digest = String((error as { digest?: string }).digest ?? "");
      if (digest.includes("NEXT_REDIRECT")) throw error;
    }
    await decrementUsagePeriod(db, user.id, "jobs.url_import_per_month");
    const message = error instanceof Error ? error.message : "Import failed.";
    redirect(`/jobs/import?error=${encodeURIComponent(message)}`);
  }
}
