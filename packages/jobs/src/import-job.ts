import { sanitizeUntrustedText } from "./html";
import {
  canonicalUrl,
  inferWorkplace,
  normalizeEmploymentType,
  parseLocation,
  salaryDisclosure,
} from "./normalize";
import { assertSafePublicHttpUrl, fetchPublicPageTitle } from "./ssrf";
import type { CanonicalJob, FetchLike } from "./types";

export type UserJobImport = {
  applyUrl: string;
  title: string;
  companyName: string;
  descriptionText?: string;
  location?: string;
  employmentType?: string;
  workplaceType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  notes?: string;
  extractMetadata?: boolean;
};

export function toUserImportedJob(
  input: UserJobImport,
  now = new Date(),
  opts?: { userId?: string },
): CanonicalJob {
  const parsed = assertSafePublicHttpUrl(input.applyUrl);
  const title = input.title.trim();
  if (!title) throw new Error("A job title is required.");
  if (!input.companyName.trim()) throw new Error("A company name is required.");
  const description = sanitizeUntrustedText(input.descriptionText ?? "");
  const locations = input.location ? [input.location] : [];
  const parsedLocation = parseLocation(input.location);
  const iso = now.toISOString();
  const url = parsed.toString();
  return {
    source: "user_import",
    externalId: `user:${opts?.userId ?? "anon"}:${canonicalUrl(url) ?? url}`,
    boardId: "",
    title,
    companyName: input.companyName.trim(),
    applyUrl: url,
    sourceUrl: url,
    canonicalUrl: canonicalUrl(url),
    descriptionText: description.text,
    workplaceType: inferWorkplace(input.workplaceType, locations),
    employmentType: normalizeEmploymentType(input.employmentType),
    locations,
    city: parsedLocation.city,
    country: parsedLocation.country,
    locationText: parsedLocation.locationText,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    salaryCurrency: input.salaryCurrency ?? null,
    salaryDisclosure: salaryDisclosure(input.salaryMin, input.salaryMax, input.salaryCurrency),
    firstSeen: iso,
    lastVerified: iso,
    status: "open",
    listingKind: "user_import",
    importNotes: input.notes?.slice(0, 2000),
    importedByUserId: opts?.userId,
    injectionFlagged: description.flagged,
  };
}

export async function importUserJob(
  input: UserJobImport,
  opts?: { fetch?: FetchLike; userId?: string; now?: Date },
): Promise<{ job: CanonicalJob; extractionError?: string; injectionFlagged: boolean }> {
  let title = input.title.trim();
  let extractionError: string | undefined;
  if (input.extractMetadata) {
    const meta = await fetchPublicPageTitle(input.applyUrl, { fetch: opts?.fetch });
    if (meta.error) extractionError = meta.error;
    if (!title && meta.title) title = meta.title;
  }
  const flagged = sanitizeUntrustedText(input.descriptionText ?? "").flagged;
  const job = toUserImportedJob({ ...input, title }, opts?.now ?? new Date(), { userId: opts?.userId });
  return { job, extractionError, injectionFlagged: flagged };
}
