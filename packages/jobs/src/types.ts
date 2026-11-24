export type JobAdapterId = "greenhouse" | "lever" | "ashby" | "user_import";

export type WorkplaceType = "remote" | "hybrid" | "onsite" | "unknown";
export type JobStatus = "open" | "expired" | "removed" | "unavailable";
export type SalaryDisclosure = "not_provided" | "not_applicable" | "unknown" | "disclosed";
export type FreshnessLabel =
  | "fresh"
  | "recently_checked"
  | "stale"
  | "expired"
  | "unavailable"
  | "source_error";
export type ListingKind = "live" | "fixture" | "user_import";
export type ApplyUrlStatus = "unchecked" | "reachable" | "unavailable" | "blocked";

export type CanonicalJob = {
  source: JobAdapterId;
  externalId: string;
  boardId?: string;
  title: string;
  companyName: string;
  applyUrl: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  descriptionText: string;
  department?: string;
  workplaceType: WorkplaceType;
  employmentType: string;
  seniority?: string;
  industry?: string;
  city?: string;
  country?: string;
  locationText?: string;
  locations: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  salaryDisclosure?: SalaryDisclosure;
  publishedAt?: string | null;
  lastProviderUpdate?: string | null;
  firstSeen: string;
  lastVerified: string;
  status: JobStatus;
  listingKind?: ListingKind;
  requiredSkills?: string[];
  preferredSkills?: string[];
  importNotes?: string;
  importedByUserId?: string;
  injectionFlagged?: boolean;
};

export type EmployerBoard = {
  adapter: Exclude<JobAdapterId, "user_import">;
  boardId: string;
  displayName: string;
  employerWebsite?: string;
  careerUrl: string;
  countries: string[];
  active: boolean;
  dateAdded: string;
  lastReviewed: string;
  sourceDocumentation: string;
  termsNote: string;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type AdapterResult =
  | { ok: true; jobs: CanonicalJob[] }
  | { ok: false; error: string; retryable: boolean; status?: number };

export interface JobAdapter {
  id: Exclude<JobAdapterId, "user_import">;
  fetchBoard(
    boardToken: string,
    opts?: { fetch?: FetchLike; now?: Date; companyName?: string },
  ): Promise<AdapterResult>;
}
