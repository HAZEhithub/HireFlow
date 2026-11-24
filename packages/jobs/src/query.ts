export type JobSort = "relevance" | "recently_posted" | "recently_verified";

export type JobSearchQuery = {
  q?: string;
  title?: string;
  company?: string;
  skill?: string;
  country?: string;
  city?: string;
  workplace?: string;
  employment?: string;
  seniority?: string;
  industry?: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  postedAfter?: string;
  sort?: JobSort;
  page?: number;
  pageSize?: number;
  includeExpired?: boolean;
};

const PAGE_SIZE_MAX = 50;
export const SEARCH_PAGE_SIZE_INTERNAL_MAX = 200;

/** Strip LIKE wildcards so user input cannot broaden a filter. */
export function likeContains(value: string): string | undefined {
  const safe = value.replace(/[%_\\]/g, "").trim();
  if (!safe) return undefined;
  return `%${safe}%`;
}

export function parseJobSearch(input: Record<string, string | undefined>): JobSearchQuery {
  const num = (value?: string) => {
    if (!value) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };
  const sort = input.sort;
  return {
    q: input.q?.trim() || undefined,
    title: input.title?.trim() || undefined,
    company: input.company?.trim() || undefined,
    skill: input.skill?.trim() || undefined,
    country: input.country?.trim().toUpperCase() || undefined,
    city: input.city?.trim() || undefined,
    workplace: input.workplace?.trim() || undefined,
    employment: input.employment?.trim() || undefined,
    seniority: input.seniority?.trim() || undefined,
    industry: input.industry?.trim() || undefined,
    department: input.department?.trim() || undefined,
    salaryMin: num(input.salaryMin),
    salaryMax: num(input.salaryMax),
    currency: input.currency?.trim().toUpperCase() || undefined,
    postedAfter: input.postedAfter?.trim() || undefined,
    sort: sort === "recently_posted" || sort === "recently_verified" || sort === "relevance" ? sort : "relevance",
    page: Math.max(1, num(input.page) ?? 1),
    pageSize: Math.min(PAGE_SIZE_MAX, Math.max(1, num(input.pageSize) ?? 20)),
    includeExpired: input.includeExpired === "true",
  };
}
