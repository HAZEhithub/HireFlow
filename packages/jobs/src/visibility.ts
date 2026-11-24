import { job } from "@hireflow/db";
import { and, eq, or, type SQL } from "drizzle-orm";
import type { CanonicalJob, ListingKind } from "./types";

export function listingKindOf(
  row: Pick<CanonicalJob, "listingKind" | "source">,
): ListingKind {
  return row.listingKind ?? (row.source === "user_import" ? "user_import" : "live");
}

/** User imports never merge with live/fixture rows or with another importer. */
export function canMergeListings(
  a: Pick<CanonicalJob, "listingKind" | "source" | "importedByUserId">,
  b: Pick<CanonicalJob, "listingKind" | "source" | "importedByUserId">,
): boolean {
  const aImport = listingKindOf(a) === "user_import";
  const bImport = listingKindOf(b) === "user_import";
  if (aImport !== bImport) return false;
  if (aImport && bImport) {
    return Boolean(a.importedByUserId && a.importedByUserId === b.importedByUserId);
  }
  return true;
}

export function jobVisibleToUser(userId: string): SQL {
  return or(
    eq(job.listingKind, "live"),
    eq(job.listingKind, "fixture"),
    and(eq(job.listingKind, "user_import"), eq(job.importedByUserId, userId)),
  ) as SQL;
}
