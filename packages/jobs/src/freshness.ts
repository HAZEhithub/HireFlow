import type { FreshnessLabel, JobStatus } from "./types";

/** Transparent thresholds. Publication date is never used as last-verified. */
export const FRESHNESS = {
  recentlyCheckedHours: 24,
  staleAfterDays: 7,
  veryStaleAfterDays: 21,
  missingConfirmationsBeforeExpire: 2,
} as const;

export function hoursBetween(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / 3_600_000;
}

export function evaluateFreshness(input: {
  now?: Date;
  firstSeen: Date;
  lastVerified: Date;
  publishedAt?: Date | null;
  status: JobStatus;
  missingConsecutive: number;
  lastRunFailed?: boolean;
}): { label: FreshnessLabel; status: JobStatus; explanation: string } {
  const now = input.now ?? new Date();
  if (input.status === "unavailable") {
    return {
      label: "unavailable",
      status: "unavailable",
      explanation: "The application URL was unreachable on a later check. The listing is retained.",
    };
  }
  if (input.status === "expired" || input.missingConsecutive >= FRESHNESS.missingConfirmationsBeforeExpire) {
    return {
      label: "expired",
      status: "expired",
      explanation: `The provider omitted this posting on ${FRESHNESS.missingConfirmationsBeforeExpire} consecutive ingestions.`,
    };
  }
  if (input.lastRunFailed) {
    return {
      label: "source_error",
      status: input.status,
      explanation: "The last provider request failed. One failure is not treated as expiry.",
    };
  }
  const hours = hoursBetween(now, input.lastVerified);
  if (hours <= FRESHNESS.recentlyCheckedHours) {
    const daysSinceFirst = hoursBetween(now, input.firstSeen) / 24;
    const publishedOld =
      input.publishedAt != null && hoursBetween(now, input.publishedAt) / 24 > 14;
    return {
      label: daysSinceFirst <= 3 && !publishedOld ? "fresh" : "recently_checked",
      status: "open",
      explanation: publishedOld
        ? "Retrieved recently from the employer board. The employer publication date is older; this is not a new posting."
        : "Successfully retrieved from the employer board within the last 24 hours. This is a retrieval check, not an independent verification of the employer.",
    };
  }
  if (hours / 24 <= FRESHNESS.staleAfterDays) {
    return {
      label: "recently_checked",
      status: "open",
      explanation: "Last successful board retrieval was within a week.",
    };
  }
  return {
    label: "stale",
    status: "open",
    explanation: `Last successful board retrieval was ${Math.floor(hours / 24)} days ago.`,
  };
}

export function nextMissingStatus(currentMissing: number): {
  missingConsecutive: number;
  status: JobStatus;
} {
  const missingConsecutive = currentMissing + 1;
  if (missingConsecutive >= FRESHNESS.missingConfirmationsBeforeExpire) {
    return { missingConsecutive, status: "expired" };
  }
  return { missingConsecutive, status: "open" };
}
