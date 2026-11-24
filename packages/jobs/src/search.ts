import {
  company,
  job,
  savedJob,
  type HireFlowDb,
} from "@hireflow/db";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { likeContains, SEARCH_PAGE_SIZE_INTERNAL_MAX, type JobSearchQuery } from "./query";
import { listVerificationSignals } from "./signals";
import { jobVisibleToUser } from "./visibility";

export type { JobSearchQuery, JobSort } from "./query";
export { parseJobSearch } from "./query";
export { jobVisibleToUser } from "./visibility";

export async function searchJobs(db: HireFlowDb, userId: string, query: JobSearchQuery) {
  const page = query.page ?? 1;
  const pageSize = Math.min(SEARCH_PAGE_SIZE_INTERNAL_MAX, Math.max(1, query.pageSize ?? 20));
  const filters: SQL[] = [jobVisibleToUser(userId)];
  if (!query.includeExpired) filters.push(eq(job.status, "open"));
  if (query.q) {
    const like = likeContains(query.q);
    if (like) {
      filters.push(
        or(
          ilike(job.title, like),
          ilike(job.descriptionText, like),
          ilike(company.name, like),
          ilike(job.department, like),
        ) as SQL,
      );
    }
  }
  if (query.title) {
    const like = likeContains(query.title);
    if (like) filters.push(ilike(job.title, like));
  }
  if (query.company) {
    const like = likeContains(query.company);
    if (like) filters.push(ilike(company.name, like));
  }
  if (query.skill) {
    const like = likeContains(query.skill.toLowerCase());
    if (like) {
      filters.push(
        sql`(lower(${job.requiredSkills}::text) like ${like} or lower(${job.preferredSkills}::text) like ${like})`,
      );
    }
  }
  if (query.country) filters.push(eq(job.country, query.country));
  if (query.city) {
    const like = likeContains(query.city);
    if (like) filters.push(ilike(job.city, like));
  }
  if (query.workplace && query.workplace !== "any") filters.push(eq(job.workplaceType, query.workplace));
  if (query.employment) filters.push(eq(job.employmentType, query.employment));
  if (query.seniority) {
    const like = likeContains(query.seniority);
    if (like) filters.push(ilike(job.seniority, like));
  }
  if (query.industry) {
    const like = likeContains(query.industry);
    if (like) filters.push(ilike(job.industry, like));
  }
  if (query.department) {
    const like = likeContains(query.department);
    if (like) filters.push(ilike(job.department, like));
  }
  if (query.salaryMin != null || query.salaryMax != null) {
    filters.push(eq(job.salaryDisclosure, "disclosed"));
    if (query.salaryMin != null) {
      filters.push(sql`coalesce(${job.salaryMax}, ${job.salaryMin}) >= ${query.salaryMin}`);
    }
    if (query.salaryMax != null) {
      filters.push(sql`coalesce(${job.salaryMin}, ${job.salaryMax}) <= ${query.salaryMax}`);
    }
  }
  if (query.currency) filters.push(eq(job.salaryCurrency, query.currency));
  if (query.postedAfter) {
    const date = new Date(query.postedAfter);
    if (!Number.isNaN(date.getTime())) {
      filters.push(sql`coalesce(${job.publishedAt}, ${job.firstSeen}) >= ${date}`);
    }
  }

  const where = and(...filters);
  const order =
    query.sort === "recently_posted"
      ? [desc(sql`coalesce(${job.publishedAt}, ${job.firstSeen})`), desc(job.id)]
      : query.sort === "recently_verified"
        ? [desc(job.lastVerified), desc(job.id)]
        : [desc(job.lastVerified), desc(job.id)];

  const rows = await db
    .select({
      job,
      company,
      savedId: savedJob.id,
    })
    .from(job)
    .innerJoin(company, eq(company.id, job.companyId))
    .leftJoin(savedJob, and(eq(savedJob.jobId, job.id), eq(savedJob.userId, userId)))
    .where(where)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(job)
    .innerJoin(company, eq(company.id, job.companyId))
    .where(where);
  const total = countRows[0]?.n ?? 0;
  const ids = rows.map((row) => row.job.id);
  const signalRows = await listVerificationSignals(db, ids);
  const signalsByJob = new Map<string, typeof signalRows>();
  for (const signal of signalRows) {
    const list = signalsByJob.get(signal.jobId) ?? [];
    list.push(signal);
    signalsByJob.set(signal.jobId, list);
  }

  return {
    total,
    page,
    pageSize,
    results: rows.map((row) => ({
      ...row.job,
      companyName: row.company.name,
      saved: Boolean(row.savedId),
      signals: signalsByJob.get(row.job.id) ?? [],
    })),
  };
}

export async function getJobForUser(db: HireFlowDb, userId: string, jobId: string) {
  const rows = await db
    .select({ job, company, savedId: savedJob.id, savedNotes: savedJob.notes, savedAt: savedJob.savedAt })
    .from(job)
    .innerJoin(company, eq(company.id, job.companyId))
    .leftJoin(savedJob, and(eq(savedJob.jobId, job.id), eq(savedJob.userId, userId)))
    .where(and(eq(job.id, jobId), jobVisibleToUser(userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const signals = await listVerificationSignals(db, [row.job.id]);
  return {
    ...row.job,
    companyName: row.company.name,
    companyWebsite: row.company.website,
    saved: Boolean(row.savedId),
    savedNotes: row.savedNotes,
    savedAt: row.savedAt,
    signals,
  };
}
