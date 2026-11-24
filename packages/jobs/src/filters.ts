export const JOB_FILTER_FACETS = {
  workplace: [
    { value: "remote", label: "Remote" },
    { value: "hybrid", label: "Hybrid" },
    { value: "onsite", label: "On-site" },
  ],
  employment: [
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "internship", label: "Internship" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
  ],
  sort: [
    { value: "relevance", label: "Most relevant" },
    { value: "recently_posted", label: "Recently posted" },
    { value: "recently_verified", label: "Recently retrieved" },
  ],
} as const;

export type FreshnessCopy = { label: string; detail: string };

export const FRESHNESS_COPY: Record<string, FreshnessCopy> = {
  fresh: {
    label: "Retrieved recently",
    detail: "Successfully fetched from the employer board in the last 24 hours. This is not an independent employer verification.",
  },
  recently_checked: {
    label: "Recently checked",
    detail: "Last successful board retrieval was within a week.",
  },
  stale: {
    label: "Stale",
    detail: "The listing has not been re-fetched from the employer board recently.",
  },
  expired: {
    label: "No longer listed",
    detail: "The employer board omitted this posting on consecutive ingestions.",
  },
  unavailable: {
    label: "Apply link unavailable",
    detail: "A later check could not reach the application URL.",
  },
  source_error: {
    label: "Source error",
    detail: "The last provider request failed. One failure is not treated as expiry.",
  },
};

export function freshnessCopy(label: string, listingKind?: string): FreshnessCopy {
  if (listingKind === "user_import") {
    return {
      label: "Imported by you",
      detail: "You saved this listing. HireFlow did not retrieve it from an employer board API.",
    };
  }
  if (listingKind === "fixture") {
    return {
      label: "Development sample",
      detail: "Loaded from HireFlow fixtures, not an employer board.",
    };
  }
  return (
    FRESHNESS_COPY[label] ??
    FRESHNESS_COPY.recently_checked ?? {
      label: "Recently checked",
      detail: "Last successful board retrieval was within a week.",
    }
  );
}
