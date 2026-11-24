import { providerGet } from "../http";
import {
  coerceText,
  extractSkillsFromText,
  inferWorkplace,
  isoFromUnknown,
  normalizeEmploymentType,
  parseLocation,
} from "../normalize";
import { persistableApplyUrl } from "../ssrf";
import type { AdapterResult, CanonicalJob, FetchLike } from "../types";

/**
 * Official Greenhouse Job Board API.
 * Docs: https://docs.greenhouse.io/job-board.html (retrieved 2026-11-21)
 * GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 */
export function greenhouseBoardUrl(boardToken: string): string {
  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export function mapGreenhouseJob(
  raw: unknown,
  boardToken: string,
  now: Date,
  companyName: string,
  listingKind: CanonicalJob["listingKind"] = "live",
): CanonicalJob | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;
  const id = row.id;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const absoluteUrl = persistableApplyUrl(typeof row.absolute_url === "string" ? row.absolute_url : "");
  if (id == null || !title || !absoluteUrl) return undefined;
  const locationName = asRecord(row.location)?.name;
  const offices = Array.isArray(row.offices)
    ? row.offices.map((office) => {
        const rec = asRecord(office);
        return typeof rec?.location === "string" ? rec.location : typeof rec?.name === "string" ? rec.name : "";
      }).filter(Boolean)
    : [];
  const locations = [
    typeof locationName === "string" ? locationName : "",
    ...offices,
  ].filter(Boolean);
  const parsed = parseLocation(locations[0]);
  const departments = Array.isArray(row.departments)
    ? row.departments.map((d) => asRecord(d)?.name).filter((n): n is string => typeof n === "string")
    : [];
  const descriptionText = coerceText(row.content);
  const skills = extractSkillsFromText(descriptionText);
  const iso = now.toISOString();
  const updated = isoFromUnknown(row.updated_at);
  return {
    source: "greenhouse",
    externalId: String(id),
    boardId: boardToken,
    title,
    companyName,
    applyUrl: absoluteUrl.toString(),
    sourceUrl: absoluteUrl.toString(),
    canonicalUrl: absoluteUrl.toString().split("?")[0],
    descriptionText,
    department: departments[0],
    workplaceType: inferWorkplace(undefined, locations),
    employmentType: normalizeEmploymentType(typeof row.employment === "string" ? row.employment : ""),
    locations,
    city: parsed.city,
    country: parsed.country,
    locationText: parsed.locationText,
    publishedAt: null,
    lastProviderUpdate: updated ?? null,
    firstSeen: iso,
    lastVerified: iso,
    status: "open",
    listingKind,
    requiredSkills: skills.required,
    preferredSkills: skills.preferred,
    salaryDisclosure: "not_provided",
  };
}

export async function fetchGreenhouseBoard(
  boardToken: string,
  opts?: { fetch?: FetchLike; now?: Date; companyName?: string; listingKind?: CanonicalJob["listingKind"] },
): Promise<AdapterResult> {
  const token = boardToken.trim();
  if (!token) return { ok: false, error: "Missing Greenhouse board token.", retryable: false };
  try {
    const response = await providerGet(greenhouseBoardUrl(token), { fetch: opts?.fetch });
    if (response.status === 429) return { ok: false, error: "Rate limited.", retryable: true, status: 429 };
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}`, retryable: response.status >= 500, status: response.status };
    const payload: unknown = await response.json();
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(asRecord(payload)?.jobs)
        ? (asRecord(payload)?.jobs as unknown[])
        : null;
    if (!list) return { ok: false, error: "Unexpected Greenhouse payload.", retryable: false };
    const now = opts?.now ?? new Date();
    const companyName = opts?.companyName ?? token;
    const jobs: CanonicalJob[] = [];
    for (const item of list) {
      const mapped = mapGreenhouseJob(item, token, now, companyName, opts?.listingKind);
      if (mapped) jobs.push(mapped);
    }
    return { ok: true, jobs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Greenhouse request failed.";
    const timeout = /abort|timeout/i.test(message);
    return { ok: false, error: timeout ? "Timeout" : message, retryable: true };
  }
}
