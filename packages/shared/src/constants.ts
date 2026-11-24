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
  "interested",
  "preparing",
  "applied",
  "assessment",
  "interview",
  "awaiting_result",
  "offer",
  "rejected",
  "withdrawn",
] as const;

/** Re-exported from entitlements so UI packages can stay catalog-aligned. */
export const FREE_AI_ASSISTS_PER_MONTH = 5;
export const MAX_FREE_RESUMES = 2;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const APPROVED_PRO_PRICE_INR_EX_GST = 199;
