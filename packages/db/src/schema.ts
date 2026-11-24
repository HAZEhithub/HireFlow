import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const profile = pgTable("profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  headline: text("headline"),
  summary: text("summary"),
  location: text("location"),
  countryCode: text("country_code"),
  preferredCountries: text("preferred_countries").array().default([]),
  workplacePreference: text("workplace_preference").notNull().default("any"),
  status: text("status").notNull().default("entry"),
  desiredTitles: text("desired_titles").array().default([]),
  industries: text("industries").array().default([]),
  experienceLevel: text("experience_level"),
  salaryMin: integer("salary_min"),
  salaryCurrency: text("salary_currency").notNull().default("INR"),
  employmentTypes: text("employment_types").array().default([]),
  workAuthorization: text("work_authorization"),
  relocation: boolean("relocation").notNull().default(false),
  availability: text("availability"),
  portfolioUrl: text("portfolio_url"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  skills: text("skills").array().default([]),
  education: jsonb("education").$type<unknown[]>().default([]),
  experience: jsonb("experience").$type<unknown[]>().default([]),
  certifications: jsonb("certifications").$type<unknown[]>().default([]),
  projects: jsonb("projects").$type<unknown[]>().default([]),
  openToInternships: boolean("open_to_internships").notNull().default(false),
  openToInternational: boolean("open_to_international").notNull().default(false),
  completeness: integer("completeness").notNull().default(0),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [uniqueIndex("profile_user_id_idx").on(t.userId)]);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  emailAlerts: boolean("email_alerts").notNull().default(false),
  productTips: boolean("product_tips").notNull().default(true),
  theme: text("theme").notNull().default("system"),
  locale: text("locale").notNull().default("en-IN"),
  aiExternalConsent: boolean("ai_external_consent").notNull().default(false),
  aiPaidConsent: boolean("ai_paid_consent").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notification = pgTable("notification", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiUsage = pgTable("ai_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  feature: text("feature").notNull(),
  provider: text("provider").notNull(),
  model: text("model"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  estimatedUsd: numeric("estimated_usd", { precision: 12, scale: 6 }),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureFlag = pgTable("feature_flag", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
});

export const usageEvent = pgTable("usage_event", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const company = pgTable("company", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  website: text("website"),
  careerPageUrl: text("career_page_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  normalizedNameIdx: uniqueIndex("company_normalized_name_idx").on(t.normalizedName),
}));

export const employerBoard = pgTable("employer_board", {
  id: text("id").primaryKey(),
  adapter: text("adapter").notNull(),
  boardIdentifier: text("board_identifier").notNull(),
  employerDisplayName: text("employer_display_name").notNull(),
  employerWebsite: text("employer_website"),
  careerPageUrl: text("career_page_url"),
  supportedCountries: jsonb("supported_countries").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  dateAdded: timestamp("date_added", { withTimezone: true }).notNull().defaultNow(),
  lastReviewed: timestamp("last_reviewed", { withTimezone: true }),
  sourceDocumentationUrl: text("source_documentation_url"),
  termsNotes: text("terms_notes"),
  lastIngestAt: timestamp("last_ingest_at", { withTimezone: true }),
  lastIngestStatus: text("last_ingest_status"),
}, (t) => ({
  adapterBoardIdx: uniqueIndex("employer_board_adapter_board_idx").on(t.adapter, t.boardIdentifier),
}));

export const job = pgTable("job", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => company.id, { onDelete: "restrict" }),
  source: text("source").notNull(),
  externalId: text("external_id").notNull(),
  boardId: text("board_id").notNull().default(""),
  title: text("title").notNull(),
  descriptionText: text("description_text").notNull().default(""),
  applyUrl: text("apply_url").notNull(),
  sourceUrl: text("source_url"),
  canonicalUrl: text("canonical_url"),
  department: text("department"),
  workplaceType: text("workplace_type").notNull().default("unknown"),
  employmentType: text("employment_type").notNull().default(""),
  seniority: text("seniority"),
  industry: text("industry"),
  city: text("city"),
  country: text("country"),
  locationText: text("location_text"),
  locations: jsonb("locations").$type<string[]>().notNull().default([]),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency"),
  salaryPeriod: text("salary_period"),
  salaryDisclosure: text("salary_disclosure").notNull().default("not_provided"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
  lastVerified: timestamp("last_verified", { withTimezone: true }).notNull().defaultNow(),
  lastProviderUpdate: timestamp("last_provider_update", { withTimezone: true }),
  lastUrlCheck: timestamp("last_url_check", { withTimezone: true }),
  status: text("status").notNull().default("open"),
  freshnessLabel: text("freshness_label").notNull().default("fresh"),
  contentHash: text("content_hash").notNull().default(""),
  fingerprint: text("fingerprint").notNull().default(""),
  descriptionFingerprint: text("description_fingerprint").notNull().default(""),
  requiredSkills: jsonb("required_skills").$type<string[]>().notNull().default([]),
  preferredSkills: jsonb("preferred_skills").$type<string[]>().notNull().default([]),
  listingKind: text("listing_kind").notNull().default("live"),
  importedByUserId: text("imported_by_user_id").references(() => user.id, { onDelete: "cascade" }),
  importNotes: text("import_notes"),
  injectionFlagged: boolean("injection_flagged").notNull().default(false),
  missingConsecutive: integer("missing_consecutive").notNull().default(0),
  applyUrlStatus: text("apply_url_status").notNull().default("unchecked"),
  rawMetadata: jsonb("raw_metadata").$type<Record<string, unknown>>(),
}, (t) => ({
  sourceExternalIdx: uniqueIndex("job_source_board_external_idx").on(t.source, t.boardId, t.externalId),
  canonicalUrlIdx: index("job_canonical_url_idx").on(t.canonicalUrl),
  fingerprintIdx: index("job_fingerprint_idx").on(t.fingerprint),
  statusVerifiedIdx: index("job_status_verified_idx").on(t.status, t.lastVerified),
  titleIdx: index("job_title_idx").on(t.title),
  companyIdx: index("job_company_idx").on(t.companyId),
  importedByIdx: index("job_imported_by_idx").on(t.importedByUserId),
  countryIdx: index("job_country_idx").on(t.country),
}));

export const jobSource = pgTable("job_source", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  adapter: text("adapter").notNull(),
  boardId: text("board_id").notNull().default(""),
  externalId: text("external_id").notNull(),
  sourceUrl: text("source_url"),
  applyUrl: text("apply_url"),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  adapterExternalIdx: uniqueIndex("job_source_adapter_board_external_idx").on(t.adapter, t.boardId, t.externalId),
  jobIdx: index("job_source_job_idx").on(t.jobId),
}));

export const jobSourceRun = pgTable("job_source_run", {
  id: text("id").primaryKey(),
  adapter: text("adapter").notNull(),
  boardId: text("board_id").notNull().default(""),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  jobsDiscovered: integer("jobs_discovered").notNull().default(0),
  jobsInserted: integer("jobs_inserted").notNull().default(0),
  jobsUpdated: integer("jobs_updated").notNull().default(0),
  jobsIgnored: integer("jobs_ignored").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  status: text("status").notNull().default("running"),
  errorSummary: text("error_summary"),
});

export const jobVerificationSignal = pgTable("job_verification_signal", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  evidence: text("evidence"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  jobIdx: index("job_verification_job_idx").on(t.jobId),
}));

export const jobSkill = pgTable("job_skill", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  skill: text("skill").notNull(),
  kind: text("kind").notNull(),
}, (t) => ({
  jobSkillIdx: uniqueIndex("job_skill_job_skill_kind_idx").on(t.jobId, t.skill, t.kind),
}));

export const savedJob = pgTable("saved_job", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "restrict" }),
  notes: text("notes"),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userJobIdx: uniqueIndex("saved_job_user_job_idx").on(t.userId, t.jobId),
  userIdx: index("saved_job_user_idx").on(t.userId),
}));

export const resume = pgTable("resume", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  originKind: text("origin_kind").notNull().default("created"),
  templateId: text("template_id").notNull().default("professional-classic"),
  sourceDocumentId: text("source_document_id"),
  originalVersionId: text("original_version_id"),
  currentVersionId: text("current_version_id"),
  parentResumeId: text("parent_resume_id"),
  targetJobId: text("target_job_id").references(() => job.id, { onDelete: "set null" }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
}, (t) => ({
  userIdx: index("resume_user_idx").on(t.userId),
  parentIdx: index("resume_parent_idx").on(t.parentResumeId),
}));

export const resumeVersion = pgTable("resume_version", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id").notNull().references(() => resume.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  notes: text("notes"),
  templateId: text("template_id").notNull().default("professional-classic"),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  isOriginal: boolean("is_original").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  resumeVersionIdx: uniqueIndex("resume_version_resume_number_idx").on(t.resumeId, t.versionNumber),
  userIdx: index("resume_version_user_idx").on(t.userId),
}));

export const resumeDocument = pgTable("resume_document", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  resumeId: text("resume_id").references(() => resume.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  storageKey: text("storage_key").notNull(),
  sha256: text("sha256").notNull(),
  parseStatus: text("parse_status"),
  parseResult: jsonb("parse_result").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("resume_document_user_idx").on(t.userId),
  resumeIdx: index("resume_document_resume_idx").on(t.resumeId),
}));

export const resumeAnalysis = pgTable("resume_analysis", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  resumeId: text("resume_id").notNull().references(() => resume.id, { onDelete: "cascade" }),
  versionId: text("version_id").notNull().references(() => resumeVersion.id, { onDelete: "cascade" }),
  completeness: integer("completeness").notNull(),
  scoreDefinition: text("score_definition").notNull(),
  findings: jsonb("findings").$type<unknown[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  resumeIdx: index("resume_analysis_resume_idx").on(t.resumeId),
}));

export const resumeJobMatch = pgTable("resume_job_match", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  resumeId: text("resume_id").notNull().references(() => resume.id, { onDelete: "cascade" }),
  versionId: text("version_id").notNull().references(() => resumeVersion.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  overall: integer("overall"),
  breakdown: jsonb("breakdown").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userJobIdx: index("resume_job_match_user_job_idx").on(t.userId, t.jobId),
}));

export const resumeTailoringSession = pgTable("resume_tailoring_session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  resumeId: text("resume_id").notNull().references(() => resume.id, { onDelete: "cascade" }),
  sourceVersionId: text("source_version_id").notNull().references(() => resumeVersion.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  suggestions: jsonb("suggestions").$type<unknown>().notNull().default([]),
  decisions: jsonb("decisions").$type<Record<string, string>>().notNull().default({}),
  resultResumeId: text("result_resume_id").references(() => resume.id, { onDelete: "set null" }),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("resume_tailoring_user_idx").on(t.userId),
}));

export const resumeExport = pgTable("resume_export", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  resumeId: text("resume_id").notNull().references(() => resume.id, { onDelete: "cascade" }),
  versionId: text("version_id").notNull().references(() => resumeVersion.id, { onDelete: "cascade" }),
  documentId: text("document_id").notNull().references(() => resumeDocument.id, { onDelete: "cascade" }),
  format: text("format").notNull(),
  templateId: text("template_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("resume_export_user_idx").on(t.userId),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(profile, { fields: [user.id], references: [profile.userId] }),
  settings: one(userSettings, { fields: [user.id], references: [userSettings.userId] }),
  sessions: many(session),
  notifications: many(notification),
  savedJobs: many(savedJob),
  importedJobs: many(job),
  resumes: many(resume),
}));

export const companyRelations = relations(company, ({ many }) => ({
  jobs: many(job),
}));

export const jobRelations = relations(job, ({ one, many }) => ({
  company: one(company, { fields: [job.companyId], references: [company.id] }),
  importedBy: one(user, { fields: [job.importedByUserId], references: [user.id] }),
  sources: many(jobSource),
  skills: many(jobSkill),
  signals: many(jobVerificationSignal),
  saves: many(savedJob),
}));

export const savedJobRelations = relations(savedJob, ({ one }) => ({
  user: one(user, { fields: [savedJob.userId], references: [user.id] }),
  job: one(job, { fields: [savedJob.jobId], references: [job.id] }),
}));

export const jobSourceRelations = relations(jobSource, ({ one }) => ({
  job: one(job, { fields: [jobSource.jobId], references: [job.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, { fields: [profile.userId], references: [user.id] }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, { fields: [userSettings.userId], references: [user.id] }),
}));

export const resumeRelations = relations(resume, ({ one, many }) => ({
  user: one(user, { fields: [resume.userId], references: [user.id] }),
  versions: many(resumeVersion),
  documents: many(resumeDocument),
}));

export const resumeVersionRelations = relations(resumeVersion, ({ one }) => ({
  resume: one(resume, { fields: [resumeVersion.resumeId], references: [resume.id] }),
  user: one(user, { fields: [resumeVersion.userId], references: [user.id] }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  profile,
  userSettings,
  auditLog,
  notification,
  aiUsage,
  featureFlag,
  usageEvent,
  company,
  employerBoard,
  job,
  jobSource,
  jobSourceRun,
  jobVerificationSignal,
  jobSkill,
  savedJob,
  resume,
  resumeVersion,
  resumeDocument,
  resumeAnalysis,
  resumeJobMatch,
  resumeTailoringSession,
  resumeExport,
  userRelations,
  notificationRelations,
  profileRelations,
  userSettingsRelations,
  companyRelations,
  jobRelations,
  savedJobRelations,
  jobSourceRelations,
  resumeRelations,
  resumeVersionRelations,
};
