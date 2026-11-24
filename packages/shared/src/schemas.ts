import { z } from "zod";
import {
  APPLICATION_PACK_SLOT_IDS,
  APPLICATION_SOURCES,
  APPLICATION_STAGES,
  EMPLOYMENT_TYPES,
  EVIDENCE_KINDS,
  PROFILE_STATUSES,
  WORKPLACE_PREFERENCES,
} from "./constants";

export const profileSchema = z.object({
  headline: z.string().max(160).optional().or(z.literal("")),
  summary: z.string().max(4000).optional().or(z.literal("")),
  location: z.string().max(120).optional().or(z.literal("")),
  countryCode: z.string().max(2).optional().or(z.literal("")),
  preferredCountries: z.array(z.string().max(2)).max(20).optional(),
  workplacePreference: z.enum(WORKPLACE_PREFERENCES).optional(),
  status: z.enum(PROFILE_STATUSES).optional(),
  desiredTitles: z.array(z.string().max(80)).max(20).optional(),
  industries: z.array(z.string().max(80)).max(20).optional(),
  experienceLevel: z.string().max(40).optional().or(z.literal("")),
  salaryMin: z.number().int().nonnegative().nullable().optional(),
  salaryCurrency: z.string().max(3).optional(),
  employmentTypes: z.array(z.enum(EMPLOYMENT_TYPES)).optional(),
  workAuthorization: z.string().max(240).optional().or(z.literal("")),
  relocation: z.boolean().optional(),
  availability: z.string().max(240).optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.string().max(80)).max(40).optional(),
  education: z.array(z.object({ label: z.string().max(240) })).max(20).optional(),
  experience: z.array(z.object({ label: z.string().max(240) })).max(20).optional(),
  certifications: z.array(z.object({ label: z.string().max(240) })).max(20).optional(),
  projects: z.array(z.object({ label: z.string().max(240) })).max(20).optional(),
  openToInternships: z.boolean().optional(),
  openToInternational: z.boolean().optional(),
});

export const settingsSchema = z.object({
  emailAlerts: z.boolean().optional(),
  productTips: z.boolean().optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
  locale: z.string().max(16).optional(),
  aiExternalConsent: z.boolean().optional(),
  aiPaidConsent: z.boolean().optional(),
});

const applicationFields = z.object({
  jobId: z.string().min(1).max(80).optional().nullable(),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  stage: z.enum(APPLICATION_STAGES).optional(),
  source: z.enum(APPLICATION_SOURCES).optional(),
  resumeVersionId: z.string().min(1).max(80).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  applyUrl: z.string().url().max(2000).optional().nullable().or(z.literal("")),
});

export const applicationWriteSchema = applicationFields.refine(
  (data) => Boolean(data.jobId) || (Boolean(data.companyName?.trim()) && Boolean(data.title?.trim())),
  { message: "Company and title are required unless a job is linked." },
);

export const applicationPatchSchema = applicationFields.partial().extend({
  companyName: z.string().trim().min(1).max(160).optional(),
  title: z.string().trim().min(1).max(200).optional(),
});

export const followUpWriteSchema = z.object({
  dueAt: z.string().min(1),
  title: z.string().trim().min(1).max(160).optional(),
  body: z.string().max(2000).optional().nullable(),
});

export const evidenceWriteSchema = z.object({
  kind: z.enum(EVIDENCE_KINDS),
  title: z.string().trim().min(1).max(160),
  body: z.string().max(4000).optional().nullable(),
  url: z.string().url().max(2000).optional().nullable().or(z.literal("")),
});

export const packItemWriteSchema = z.object({
  slot: z.enum(APPLICATION_PACK_SLOT_IDS),
  body: z.string().trim().min(1).max(8000),
});

export const onboardingSchema = profileSchema.extend({
  name: z.string().min(1).max(80),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
