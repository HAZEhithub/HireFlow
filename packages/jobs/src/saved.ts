import { randomUUID } from "node:crypto";
import { company, job, savedJob, type HireFlowDb } from "@hireflow/db";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { likeContains } from "./query";
import { jobVisibleToUser } from "./visibility";

export async function saveJobForUser(db: HireFlowDb, userId: string, jobId: string, notes?: string) {
  const existing = await db.query.savedJob.findFirst({
    where: and(eq(savedJob.userId, userId), eq(savedJob.jobId, jobId)),
  });
  if (existing) {
    if (notes !== undefined) {
      await db.update(savedJob).set({ notes }).where(eq(savedJob.id, existing.id));
    }
    return existing;
  }
  const row = { id: randomUUID(), userId, jobId, notes: notes ?? null, savedAt: new Date() };
  await db.insert(savedJob).values(row);
  return row;
}

export async function unsaveJobForUser(db: HireFlowDb, userId: string, jobId: string) {
  await db.delete(savedJob).where(and(eq(savedJob.userId, userId), eq(savedJob.jobId, jobId)));
}

export async function listSavedJobs(
  db: HireFlowDb,
  userId: string,
  opts?: { q?: string },
) {
  const filters = [eq(savedJob.userId, userId), jobVisibleToUser(userId)];
  if (opts?.q) {
    const like = likeContains(opts.q);
    if (like) filters.push(or(ilike(job.title, like), ilike(company.name, like))!);
  }
  return db
    .select({
      saved: savedJob,
      job,
      company,
    })
    .from(savedJob)
    .innerJoin(job, eq(job.id, savedJob.jobId))
    .innerJoin(company, eq(company.id, job.companyId))
    .where(and(...filters))
    .orderBy(desc(savedJob.savedAt));
}

export async function countImportsThisMonth(db: HireFlowDb, userId: string) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const rows = await db.query.job.findMany({
    where: and(eq(job.importedByUserId, userId), eq(job.source, "user_import")),
  });
  return rows.filter((row) => row.firstSeen >= start).length;
}
