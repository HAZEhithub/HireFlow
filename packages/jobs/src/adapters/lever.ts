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
 * Official Lever Postings API.
 * Docs: https://github.com/lever/postings-api (retrieved 2026-11-21)
 * GET https://api.lever.co/v0/postings/{SITE}?mode=json&skip=&limit=
 */
export const LEVER_PAGE_SIZE = 100;

export function leverBoardUrl(site: string, skip = 0, limit = LEVER_PAGE_SIZE): string {
  const params = new URLSearchParams({ mode: "json", skip: String(skip), limit: String(limit) });
  return `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?${params.toString()}`;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export function mapLeverJob(
  raw: unknown,
  site: string,
  now: Date,
  companyName: string,
  listingKind: CanonicalJob["listingKind"] = "live",
): CanonicalJob | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;
  const id = typeof row.id === "string" ? row.id : row.id != null ? String(row.id) : "";
  const title = typeof row.text === "string" ? row.text.trim() : "";
  const applyUrl = persistableApplyUrl(
    (typeof row.applyUrl === "string" && row.applyUrl) ||
      (typeof row.hostedUrl === "string" && row.hostedUrl) ||
      "",
  );
  if (!id || !title || !applyUrl) return undefined;
  const categories = asRecord(row.categories);
  const allLocations = Array.isArray(categories?.allLocations)
    ? categories.allLocations.filter((v): v is string => typeof v === "string")
    : [];
  const location = typeof categories?.location === "string" ? categories.location : "";
  const locations = [...new Set([location, ...allLocations].filter(Boolean))];
  const parsed = parseLocation(locations[0]);
  const workplaceRaw = typeof row.workplaceType === "string" ? row.workplaceType : location;
  const descriptionText = coerceText(row.descriptionPlain ?? row.description);
  const skills = extractSkillsFromText(descriptionText);
  const salary = asRecord(row.salaryRange);
  const min = typeof salary?.min === "number" ? salary.min : undefined;
  const max = typeof salary?.max === "number" ? salary.max : undefined;
  const currency = typeof salary?.currency === "string" ? salary.currency : undefined;
  const iso = now.toISOString();
  const created = isoFromUnknown(row.createdAt);
  return {
    source: "lever",
    externalId: id,
    boardId: site,
    title,
    companyName,
    applyUrl: applyUrl.toString(),
    sourceUrl: persistableApplyUrl(typeof row.hostedUrl === "string" ? row.hostedUrl : "")?.toString() ?? applyUrl.toString(),
    canonicalUrl: applyUrl.toString().split("?")[0],
    descriptionText,
    department:
      (typeof categories?.team === "string" && categories.team) ||
      (typeof categories?.department === "string" && categories.department) ||
      undefined,
    workplaceType: inferWorkplace(workplaceRaw, locations),
    employmentType: normalizeEmploymentType(
      typeof categories?.commitment === "string" ? categories.commitment : "",
    ),
    locations,
    city: parsed.city,
    country: parsed.country,
    locationText: parsed.locationText,
    salaryMin: min ?? null,
    salaryMax: max ?? null,
    salaryCurrency: currency ?? null,
    salaryPeriod: typeof salary?.interval === "string" ? salary.interval : null,
    salaryDisclosure: salaryDisclosure(min, max, currency),
    publishedAt: created ?? null,
    lastProviderUpdate: created ?? null,
    firstSeen: iso,
    lastVerified: iso,
    status: "open",
    listingKind,
    requiredSkills: skills.required,
    preferredSkills: skills.preferred,
  };
}

export async function fetchLeverBoard(
  site: string,
  opts?: { fetch?: FetchLike; now?: Date; companyName?: string; listingKind?: CanonicalJob["listingKind"] },
): Promise<AdapterResult> {
  const token = site.trim();
  if (!token) return { ok: false, error: "Missing Lever site identifier.", retryable: false };
  const now = opts?.now ?? new Date();
  const companyName = opts?.companyName ?? token;
  const jobs: CanonicalJob[] = [];
  let skip = 0;
  try {
    for (;;) {
      const response = await providerGet(leverBoardUrl(token, skip), { fetch: opts?.fetch });
      if (response.status === 429) return { ok: false, error: "Rate limited.", retryable: true, status: 429 };
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}`, retryable: response.status >= 500, status: response.status };
      }
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) return { ok: false, error: "Unexpected Lever payload.", retryable: false };
      for (const item of payload) {
        const mapped = mapLeverJob(item, token, now, companyName, opts?.listingKind);
        if (mapped) jobs.push(mapped);
      }
      if (payload.length < LEVER_PAGE_SIZE) break;
      skip += LEVER_PAGE_SIZE;
      if (skip > 5_000) break;
    }
    return { ok: true, jobs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lever request failed.";
    const timeout = /abort|timeout/i.test(message);
    return { ok: false, error: timeout ? "Timeout" : message, retryable: true };
  }
}
