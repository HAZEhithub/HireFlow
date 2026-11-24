import { canonicalUrl, fingerprint, normalizeCompany, normalizeTitle } from "./normalize";
import type { CanonicalJob } from "./types";
import { canMergeListings } from "./visibility";

export type DuplicateKind = "exact" | "probable" | "distinct";

export type DuplicateDecision = {
  kind: DuplicateKind;
  reason: string;
};

export function decideDuplicate(a: CanonicalJob, b: CanonicalJob): DuplicateDecision {
  if (a.source === b.source && (a.boardId ?? "") === (b.boardId ?? "") && a.externalId === b.externalId) {
    return { kind: "exact", reason: "Same provider, board, and external identifier." };
  }
  if (!canMergeListings(a, b)) {
    return {
      kind: "distinct",
      reason: "User imports stay private to the importer and never merge with live board listings.",
    };
  }
  const urlA = a.canonicalUrl ?? canonicalUrl(a.applyUrl);
  const urlB = b.canonicalUrl ?? canonicalUrl(b.applyUrl);
  if (urlA && urlB && urlA === urlB) {
    return { kind: "exact", reason: "Same canonical application URL." };
  }
  const sameCompany = normalizeCompany(a.companyName) === normalizeCompany(b.companyName);
  const sameTitle = normalizeTitle(a.title) === normalizeTitle(b.title);
  const samePlace =
    fingerprint(a) === fingerprint(b) ||
    ((a.city ?? "").toLowerCase() === (b.city ?? "").toLowerCase() &&
      (a.country ?? "") === (b.country ?? "") &&
      a.workplaceType === b.workplaceType);
  if (sameCompany && sameTitle && samePlace) {
    return {
      kind: "exact",
      reason: "Same employer, normalized title, and location/workplace across sources.",
    };
  }
  if (sameCompany && sameTitle && !samePlace) {
    return {
      kind: "distinct",
      reason: "Same employer and similar title but different location or workplace — treated as separate openings.",
    };
  }
  if (
    sameCompany &&
    a.descriptionText &&
    b.descriptionText &&
    a.descriptionText.slice(0, 400).toLowerCase() === b.descriptionText.slice(0, 400).toLowerCase()
  ) {
    return { kind: "probable", reason: "Same employer and matching description prefix; titles differ." };
  }
  return { kind: "distinct", reason: "No exact or probable duplicate rule matched." };
}
