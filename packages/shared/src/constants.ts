export const APP_NAME = "HireFlow";
export const TAGLINE = "Your career, compounded.";
export const FUNCTIONAL_LINE = "Jobs you can trust. Matches you can explain.";

export const WORKPLACE_PREFERENCES = ["remote", "hybrid", "onsite", "any"] as const;
export const PROFILE_STATUSES = [
  "student",
  "internship",
  "entry",
  "experienced",
  "career_change",
  "returning",
] as const;
export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "internship",
  "contract",
  "freelance",
] as const;

export const APPLICATION_STAGES = [
  "saved",
  "preparing",
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export const APPLICATION_STAGE_LABELS: Record<(typeof APPLICATION_STAGES)[number], string> = {
  saved: "Saved",
  preparing: "Preparing",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const APPLICATION_SOURCES = ["saved_job", "discover", "user_import", "manual"] as const;

export const EVIDENCE_KINDS = ["project", "letter", "transcript", "url", "metric", "other"] as const;

export const APPLICATION_PACK_SLOT_IDS = [
  "resume",
  "cover_letter",
  "outreach",
  "screening",
  "interview",
] as const;

export const MAX_FREE_EVIDENCE = 10;
export const MAX_PRO_EVIDENCE = 50;

/** Re-exported from entitlements so UI packages can stay catalog-aligned. */
export const FREE_AI_ASSISTS_PER_MONTH = 5;
export const MAX_FREE_RESUMES = 2;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const APPROVED_PRO_PRICE_INR_EX_GST = 199;
