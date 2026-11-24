import { providerGet } from "../http";
import {
  coerceText,
  extractSkillsFromText,
  inferWorkplace,
  isoFromUnknown,
  normalizeEmploymentType,
  parseLocation,
  salaryDisclosure,
} from "../normalize";
import { persistableApplyUrl } from "../ssrf";
import type { AdapterResult, CanonicalJob, FetchLike } from "../types";

/**
 * Official Ashby Public Job Posting API.
 * Docs: https://developers.ashbyhq.com/docs/public-job-posting-api (retrieved 2026-11-21)
 * GET https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}?includeCompensation=true
 */
export function ashbyBoardUrl(boardName: string): string {
  return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}?includeCompensation=true`;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function compensation(raw: unknown): {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
} {
  const rec = asRecord(raw);
  if (!rec) return {};
  const tiers = Array.isArray(rec.compensationTiers) ? rec.compensationTiers : [];
  const first = asRecord(tiers[0]);
  const components = Array.isArray(first?.components) ? first.components : [];
  const pay = asRecord(components[0]);
  const min = typeof pay?.minValue === "number" ? pay.minValue : typeof rec.compensationMin === "number" ? rec.compensationMin : undefined;
  const max = typeof pay?.maxValue === "number" ? pay.maxValue : typeof rec.compensationMax === "number" ? rec.compensationMax : undefined;
  const currency = typeof pay?.currencyCode === "string" ? pay.currencyCode : typeof rec.currencyCode === "string" ? rec.currencyCode : undefined;
  const period = typeof pay?.interval === "string" ? pay.interval : undefined;
  return { min, max, currency, period };
}

export function mapAshbyJob(
  raw: unknown,
  boardName: string,
  now: Date,
  companyName: string,
  listingKind: CanonicalJob["listingKind"] = "live",
): CanonicalJob | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;
  if (row.isListed === false) return undefined;
  const id = row.id != null ? String(row.id) : typeof row.jobId === "string" ? row.jobId : "";
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const applyUrl = persistableApplyUrl(
    (typeof row.applyUrl === "string" && row.applyUrl) ||
      (typeof row.jobUrl === "string" && row.jobUrl) ||
      "",
  );
  if (!id || !title || !applyUrl) return undefined;
  const location = typeof row.location === "string" ? row.location : "";
  const parsed = parseLocation(location);
  const descriptionText = coerceText(row.descriptionPlain ?? row.descriptionHtml ?? row.description);
  const skills = extractSkillsFromText(descriptionText);
  const pay = compensation(row.compensation);
  const iso = now.toISOString();
  const published = isoFromUnknown(row.publishedAt);
  return {
    source: "ashby",
    externalId: id,
    boardId: boardName,
    title,
    companyName,
    applyUrl: applyUrl.toString(),
    sourceUrl: persistableApplyUrl(typeof row.jobUrl === "string" ? row.jobUrl : "")?.toString() ?? applyUrl.toString(),
    canonicalUrl: applyUrl.toString().split("?")[0],
    descriptionText,
    department: typeof row.department === "string" ? row.department : typeof row.team === "string" ? row.team : undefined,
    workplaceType: inferWorkplace(typeof row.workplaceType === "string" ? row.workplaceType : undefined, [location]),
    employmentType: normalizeEmploymentType(typeof row.employmentType === "string" ? row.employmentType : ""),
    locations: location ? [location] : [],
    city: parsed.city,
    country: parsed.country,
    locationText: parsed.locationText,
    salaryMin: pay.min ?? null,
    salaryMax: pay.max ?? null,
    salaryCurrency: pay.currency ?? null,
    salaryPeriod: pay.period ?? null,
    salaryDisclosure: salaryDisclosure(pay.min, pay.max, pay.currency),
    publishedAt: published ?? null,
    lastProviderUpdate: published ?? null,
    firstSeen: iso,
    lastVerified: iso,
    status: "open",
    listingKind,
    requiredSkills: skills.required,
    preferredSkills: skills.preferred,
  };
}

export async function fetchAshbyBoard(
  boardName: string,
  opts?: { fetch?: FetchLike; now?: Date; companyName?: string; listingKind?: CanonicalJob["listingKind"] },
): Promise<AdapterResult> {
  const token = boardName.trim();
  if (!token) return { ok: false, error: "Missing Ashby job-board name.", retryable: false };
  try {
    const response = await providerGet(ashbyBoardUrl(token), { fetch: opts?.fetch });
    if (response.status === 429) return { ok: false, error: "Rate limited.", retryable: true, status: 429 };
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}`, retryable: response.status >= 500, status: response.status };
    const payload: unknown = await response.json();
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(asRecord(payload)?.jobs)
        ? (asRecord(payload)?.jobs as unknown[])
        : null;
    if (!list) return { ok: false, error: "Unexpected Ashby payload.", retryable: false };
    const now = opts?.now ?? new Date();
    const companyName = opts?.companyName ?? token;
    const jobs: CanonicalJob[] = [];
    for (const item of list) {
      const mapped = mapAshbyJob(item, token, now, companyName, opts?.listingKind);
      if (mapped) jobs.push(mapped);
    }
    return { ok: true, jobs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ashby request failed.";
    const timeout = /abort|timeout/i.test(message);
    return { ok: false, error: timeout ? "Timeout" : message, retryable: true };
  }
}
