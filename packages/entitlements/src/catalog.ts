export const PLAN_IDS = ["free", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const SUBSCRIPTION_STATUSES = ["none", "active", "past_due", "canceled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** No payment collection until the owner explicitly enables billing. */
export const BILLING_LIVE = false;

export const PLANS = {
  free: {
    id: "free" as const,
    displayName: "Free",
    priceInrExGst: 0,
    interval: "month" as const,
    region: "IN" as const,
    offerCopy: "₹0",
    billingLive: false,
  },
  pro: {
    id: "pro" as const,
    displayName: "Pro",
    priceInrExGst: 199,
    interval: "month" as const,
    region: "IN" as const,
    gst: "applicable" as const,
    offerCopy: "₹199/month + applicable GST",
    indicativeGstRateHypothesis: 0.18,
    indicativeTotalInr: 234.82,
    indicativeUsdHypothesis: 9,
    billingLive: false,
    notAnOfferUntilBilling: true,
  },
} as const;

export type LimitValue = number | "unlimited" | boolean;
export type EntitlementKind = "boolean" | "quota";

export type EntitlementKey =
  | "auth.session"
  | "profile.read_write"
  | "settings.read_write"
  | "notifications.inbox"
  | "usage.read"
  | "jobs.discover"
  | "applications.tracker"
  | "resumes.studio"
  | "account.export"
  | "account.delete"
  | "jobs.search_filters"
  | "jobs.save"
  | "jobs.url_import_per_month"
  | "jobs.alerts"
  | "jobs.trust_signals"
  | "matching.explainable"
  | "resumes.max_versions"
  | "resumes.parse_export"
  | "ai.assists_per_month"
  | "ai.resume_analysis"
  | "resume.tailoring"
  | "resume.cover_letter"
  | "applications.follow_ups"
  | "applications.analytics"
  | "extension.save_job"
  | "evidence.vault_items"
  | "applications.pack"
  | "matching.evidence_map"
  | "prepare.company_brief"
  | "prepare.interview"
  | "coach.search_strategy"
  | "skills.graph"
  | "research.portfolio"
  | "research.salary_sim"
  | "research.networking_crm"
  | "research.mentor_marketplace";

export type EntitlementDefinition = {
  key: EntitlementKey;
  kind: EntitlementKind;
  unit?: "count" | "count_per_month";
  free: LimitValue;
  pro: LimitValue;
  implementedNow: boolean;
  earliestPhase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  grantable: boolean;
  complimentaryWhileBillingOff?: boolean;
  notes: string;
};

export const ENTITLEMENTS: readonly EntitlementDefinition[] = [
  { key: "auth.session", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "Better Auth session." },
  { key: "profile.read_write", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "Career profile." },
  { key: "settings.read_write", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "Privacy and preferences." },
  { key: "notifications.inbox", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "Empty inbox is valid." },
  { key: "usage.read", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "AI and request counters. No prompt bodies." },
  { key: "jobs.discover", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "Curated ATS registry plus URL import. Empty until boards or fixtures are ingested." },
  { key: "applications.tracker", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "Unlimited application tracker on Free." },
  { key: "resumes.studio", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "Resume Studio dashboard, editor, and preview." },
  { key: "account.export", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "JSON export." },
  { key: "account.delete", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 1, grantable: true, notes: "Account deletion." },
  { key: "jobs.search_filters", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 2, grantable: true, notes: "Never paywall search." },
  { key: "jobs.save", kind: "quota", unit: "count", free: "unlimited", pro: "unlimited", implementedNow: true, earliestPhase: 2, grantable: true, notes: "Free unlimited saves." },
  { key: "jobs.url_import_per_month", kind: "quota", unit: "count_per_month", free: 30, pro: 100, implementedNow: true, earliestPhase: 2, grantable: true, notes: "Abuse cap." },
  { key: "jobs.alerts", kind: "quota", unit: "count", free: 1, pro: 5, implementedNow: false, earliestPhase: 2, grantable: true, notes: "In-app first." },
  { key: "jobs.trust_signals", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 2, grantable: true, notes: "Warnings, not accusations. Retrieval is not independent verification." },
  { key: "matching.explainable", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 3, grantable: true, notes: "Deterministic overlap only. Semantic matching remains Phase 3." },
  { key: "resumes.max_versions", kind: "quota", unit: "count", free: 2, pro: "unlimited", implementedNow: true, earliestPhase: 3, grantable: true, notes: "Free: two resume documents. Existing documents stay readable after the cap." },
  { key: "resumes.parse_export", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 3, grantable: true, notes: "Parse PDF/DOCX/TXT locally. User review required before saving structured fields." },
  { key: "ai.assists_per_month", kind: "quota", unit: "count_per_month", free: 5, pro: 50, implementedNow: true, earliestPhase: 3, grantable: true, notes: "Optional local Ollama phrasing only. Deterministic parse/match/export do not count. 50 is a cost cap, not unlimited AI." },
  { key: "ai.resume_analysis", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 3, grantable: true, notes: "Documentation alias of matching.explainable plus resumes.parse_export. Deterministic overlap and local parse only — not a separate LLM analysis product." },
  { key: "resume.tailoring", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 3, grantable: true, notes: "Deterministic, user-approved suggestions. Never overwrites the original. Counts toward resume document cap." },
  { key: "resume.cover_letter", kind: "boolean", free: false, pro: true, implementedNow: false, earliestPhase: 5, grantable: true, notes: "Cover letter drafts, user-approved." },
  { key: "applications.follow_ups", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 4, grantable: true, notes: "In-app reminders. HireFlow never emails unless Resend is configured later." },
  { key: "applications.analytics", kind: "boolean", free: false, pro: true, implementedNow: true, earliestPhase: 6, grantable: true, complimentaryWhileBillingOff: true, notes: "Personal pipeline analytics with small-n caveats. Complimentary while billing is off; Pro when checkout is approved." },
  { key: "extension.save_job", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 5, grantable: true, notes: "Clips visible tab title and URL. Not ingestion. Never auto-submits." },
  { key: "evidence.vault_items", kind: "quota", unit: "count", free: 10, pro: 50, implementedNow: true, earliestPhase: 5, grantable: true, notes: "Career Evidence Vault. User-provided; never invented." },
  { key: "applications.pack", kind: "boolean", free: true, pro: true, implementedNow: true, earliestPhase: 5, grantable: true, notes: "Free assemble by paste. Pro AI drafts remain unimplemented." },
  { key: "matching.evidence_map", kind: "boolean", free: false, pro: true, implementedNow: true, earliestPhase: 6, grantable: true, complimentaryWhileBillingOff: true, notes: "Requirement-to-evidence job-fit map from resume quotes. Complimentary while billing is off; Pro when checkout is approved." },
  { key: "prepare.company_brief", kind: "boolean", free: false, pro: true, implementedNow: true, earliestPhase: 6, grantable: true, complimentaryWhileBillingOff: true, notes: "Company brief from sourced ATS/job fields only. Complimentary while billing is off; Pro when checkout is approved." },
  { key: "prepare.interview", kind: "boolean", free: false, pro: true, implementedNow: false, earliestPhase: 6, grantable: true, notes: "Interview practice. Not implemented. No live copilots." },
  { key: "coach.search_strategy", kind: "boolean", free: false, pro: true, implementedNow: false, earliestPhase: 7, grantable: true, notes: "User pipeline only." },
  { key: "skills.graph", kind: "boolean", free: false, pro: true, implementedNow: false, earliestPhase: 7, grantable: true, notes: "No market demand claims." },
  { key: "research.portfolio", kind: "boolean", free: false, pro: false, implementedNow: false, earliestPhase: 8, grantable: false, notes: "Research only." },
  { key: "research.salary_sim", kind: "boolean", free: false, pro: false, implementedNow: false, earliestPhase: 8, grantable: false, notes: "Research only." },
  { key: "research.networking_crm", kind: "boolean", free: false, pro: false, implementedNow: false, earliestPhase: 8, grantable: false, notes: "Research only." },
  { key: "research.mentor_marketplace", kind: "boolean", free: false, pro: false, implementedNow: false, earliestPhase: 8, grantable: false, notes: "Launch non-goal." },
];

export function entitlement(key: EntitlementKey): EntitlementDefinition {
  const row = ENTITLEMENTS.find((item) => item.key === key);
  if (!row) throw new Error(`Unknown entitlement: ${key}`);
  return row;
}

export function limitFor(def: EntitlementDefinition, plan: PlanId): LimitValue {
  return plan === "pro" ? def.pro : def.free;
}

export const FREE_AI_ASSISTS_PER_MONTH = 5;
export const MAX_FREE_RESUMES = 2;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
