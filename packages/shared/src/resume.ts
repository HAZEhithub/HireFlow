import { z } from "zod";

export const RESUME_TEMPLATE_IDS = [
  "professional-classic",
  "modern-professional",
  "compact-technical",
] as const;
export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export const RESUME_SECTION_IDS = [
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "achievements",
  "languages",
  "links",
  "custom",
] as const;
export type ResumeSectionId = (typeof RESUME_SECTION_IDS)[number];

export const RESUME_ORIGIN_KINDS = ["created", "uploaded", "tailored", "duplicated"] as const;
export type ResumeOriginKind = (typeof RESUME_ORIGIN_KINDS)[number];

const shortText = (max: number) => z.string().max(max);
const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));

export const resumeLinkSchema = z.object({
  id: z.string().min(1).max(64),
  label: shortText(80),
  url: shortText(500),
});

export const resumeSkillGroupSchema = z.object({
  id: z.string().min(1).max(64),
  category: shortText(80).optional().or(z.literal("")),
  items: z.array(shortText(80)).max(40),
});

export const resumeExperienceSchema = z.object({
  id: z.string().min(1).max(64),
  title: shortText(160),
  company: shortText(160),
  location: optionalText(160),
  startDate: optionalText(40),
  endDate: optionalText(40),
  current: z.boolean().optional(),
  responsibilities: z.array(shortText(800)).max(24),
  achievements: z.array(shortText(800)).max(24),
});

export const resumeEducationSchema = z.object({
  id: z.string().min(1).max(64),
  school: shortText(200),
  credential: optionalText(200),
  field: optionalText(160),
  location: optionalText(160),
  startDate: optionalText(40),
  endDate: optionalText(40),
  details: z.array(shortText(400)).max(12),
});

export const resumeProjectSchema = z.object({
  id: z.string().min(1).max(64),
  name: shortText(200),
  url: optionalText(500),
  summary: optionalText(800),
  bullets: z.array(shortText(800)).max(16),
  technologies: z.array(shortText(80)).max(24),
});

export const resumeCertificationSchema = z.object({
  id: z.string().min(1).max(64),
  name: shortText(200),
  issuer: optionalText(160),
  date: optionalText(40),
  url: optionalText(500),
});

export const resumeLanguageSchema = z.object({
  id: z.string().min(1).max(64),
  name: shortText(80),
  proficiency: optionalText(80),
});

export const resumeCustomSectionSchema = z.object({
  id: z.string().min(1).max(64),
  title: shortText(120),
  items: z.array(shortText(800)).max(24),
});

export const resumePersonalSchema = z.object({
  fullName: optionalText(120),
  headline: optionalText(200),
  email: optionalText(160),
  phone: optionalText(40),
  location: optionalText(160),
  summary: optionalText(4000),
});

export const structuredResumeSchema = z.object({
  personal: resumePersonalSchema,
  skills: z.array(resumeSkillGroupSchema).max(12),
  experience: z.array(resumeExperienceSchema).max(20),
  education: z.array(resumeEducationSchema).max(12),
  projects: z.array(resumeProjectSchema).max(16),
  certifications: z.array(resumeCertificationSchema).max(16),
  achievements: z.array(shortText(800)).max(20),
  languages: z.array(resumeLanguageSchema).max(12),
  links: z.array(resumeLinkSchema).max(12),
  customSections: z.array(resumeCustomSectionSchema).max(8),
  sectionOrder: z.array(z.enum(RESUME_SECTION_IDS)).max(12),
});

export type StructuredResume = z.infer<typeof structuredResumeSchema>;
export type ResumeExperience = z.infer<typeof resumeExperienceSchema>;
export type ResumeEducation = z.infer<typeof resumeEducationSchema>;
export type ResumeProject = z.infer<typeof resumeProjectSchema>;

export const resumeContentPatchSchema = structuredResumeSchema.partial();

export const resumeWriteSchema = z.object({
  title: shortText(120).optional(),
  templateId: z.enum(RESUME_TEMPLATE_IDS).optional(),
  content: structuredResumeSchema.optional(),
  notes: optionalText(500),
  copyConfirmedFieldsToProfile: z.boolean().optional(),
});

export function emptyStructuredResume(): StructuredResume {
  return {
    personal: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      summary: "",
    },
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    links: [],
    customSections: [],
    sectionOrder: [...RESUME_SECTION_IDS],
  };
}

export const RESUME_TEMPLATE_CATALOG: Record<
  ResumeTemplateId,
  { name: string; description: string; audience: string }
> = {
  "professional-classic": {
    name: "Professional Classic",
    description: "Traditional structure, conservative spacing, and clear typography.",
    audience: "Corporate and technical roles",
  },
  "modern-professional": {
    name: "Modern Professional",
    description: "Strong hierarchy and balanced whitespace without decorative graphics.",
    audience: "Technology and international roles",
  },
  "compact-technical": {
    name: "Compact Technical",
    description: "Skills-forward layout with efficient space usage and project emphasis.",
    audience: "Engineering and entry-level applicants",
  },
};

export const COMPLETENESS_SCORE_DEFINITION =
  "Completeness is the share of expected resume sections that contain user-confirmed content. Contact, summary, skills, and experience are weighted more heavily. It is not an ATS score and not a hiring probability.";
