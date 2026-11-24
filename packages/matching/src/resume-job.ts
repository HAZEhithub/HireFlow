import type { StructuredResume } from "@hireflow/shared";
import { explainMatch, type MatchExplanation } from "./explain";

export type EvidenceStatus = "strong" | "partial" | "missing" | "insufficient";

export type RequirementEvidence = {
  requirement: string;
  kind: "required_skill" | "preferred_skill" | "title" | "experience" | "education" | "location";
  status: EvidenceStatus;
  evidence: Array<{ section: string; text: string }>;
  note: string;
};

export type ResumeJobCompatibility = MatchExplanation & {
  evidence: RequirementEvidence[];
  suggestedImprovements: string[];
  methodology: string;
};

function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+.#]+/g, " ").trim();
}

function tokens(value: string) {
  return norm(value)
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
}

export function flattenResumeSkills(resume: StructuredResume): string[] {
  return resume.skills.flatMap((group) => group.items.map((item) => item.trim()).filter(Boolean));
}

export function flattenResumeTitles(resume: StructuredResume): string[] {
  const titles = [
    resume.personal.headline ?? "",
    ...resume.experience.map((row) => row.title),
    ...resume.projects.map((row) => row.name),
  ];
  return titles.map((item) => item.trim()).filter(Boolean);
}

function haystack(resume: StructuredResume): Array<{ section: string; text: string }> {
  const rows: Array<{ section: string; text: string }> = [];
  const push = (section: string, text?: string) => {
    const value = text?.trim();
    if (value) rows.push({ section, text: value });
  };
  push("summary", resume.personal.summary);
  push("headline", resume.personal.headline);
  push("location", resume.personal.location);
  for (const group of resume.skills) {
    for (const item of group.items) push("skills", item);
  }
  for (const exp of resume.experience) {
    push("experience", [exp.title, exp.company, exp.location, exp.startDate, exp.endDate].filter(Boolean).join(" · "));
    for (const line of exp.responsibilities) push("experience", line);
    for (const line of exp.achievements) push("experience", line);
  }
  for (const project of resume.projects) {
    push("projects", [project.name, project.summary, project.technologies.join(", ")].filter(Boolean).join(" — "));
    for (const line of project.bullets) push("projects", line);
  }
  for (const edu of resume.education) {
    push("education", [edu.school, edu.credential, edu.field].filter(Boolean).join(" · "));
  }
  for (const cert of resume.certifications) push("certifications", cert.name);
  return rows;
}

function findEvidence(resume: StructuredResume, skill: string): Array<{ section: string; text: string }> {
  const needle = norm(skill);
  if (!needle) return [];
  return haystack(resume)
    .filter((row) => {
      const hay = norm(row.text);
      return hay === needle || hay.includes(needle) || tokens(row.text).includes(needle);
    })
    .slice(0, 4);
}

function extractYearsRequired(description: string): number | null {
  const match = description.match(/(\d+)\+?\s+years?/);
  if (!match?.[1]) return null;
  const years = Number(match[1]);
  return Number.isFinite(years) ? years : null;
}

function confirmedExperienceYears(resume: StructuredResume): number | null {
  const dated = resume.experience.filter((row) => /^\d{4}/.test(row.startDate ?? ""));
  if (!dated.length) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const row of dated) {
    const start = Number((row.startDate ?? "").slice(0, 4));
    const endRaw = row.current ? new Date().getUTCFullYear() : Number((row.endDate ?? "").slice(0, 4));
    if (!Number.isFinite(start)) continue;
    min = Math.min(min, start);
    if (Number.isFinite(endRaw)) max = Math.max(max, endRaw);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
  return max - min;
}

export function matchResumeToJob(
  resume: StructuredResume,
  job: {
    title: string;
    requiredSkills?: string[] | null;
    preferredSkills?: string[] | null;
    workplaceType?: string | null;
    employmentType?: string | null;
    locationText?: string | null;
    city?: string | null;
    seniority?: string | null;
    descriptionText?: string | null;
  },
  profileHints?: {
    workplacePreference?: string | null;
    employmentTypes?: string[] | null;
    experienceLevel?: string | null;
  },
): ResumeJobCompatibility {
  const required = job.requiredSkills ?? [];
  const preferred = job.preferredSkills ?? [];
  const skills = flattenResumeSkills(resume);
  const titles = flattenResumeTitles(resume);
  const base = explainMatch({
    profileSkills: skills,
    jobSkills: [...required, ...preferred],
    jobRequiredSkills: required,
    jobPreferredSkills: preferred,
    profileTitles: titles,
    jobTitle: job.title,
    remoteOk: profileHints?.workplacePreference === "remote",
    profileWorkplace: profileHints?.workplacePreference ?? undefined,
    jobWorkplace: job.workplaceType ?? undefined,
    profileLocation: resume.personal.location || undefined,
    jobLocation: job.locationText ?? job.city ?? undefined,
    profileEmploymentTypes: profileHints?.employmentTypes ?? [],
    jobEmploymentType: job.employmentType || undefined,
    profileExperience: profileHints?.experienceLevel ?? undefined,
    jobSeniority: job.seniority ?? undefined,
  });

  const evidence: RequirementEvidence[] = [];
  for (const skill of required) {
    const hits = findEvidence(resume, skill);
    const inSkills = skills.some((item) => norm(item) === norm(skill));
    evidence.push({
      requirement: skill,
      kind: "required_skill",
      status: inSkills && hits.length ? "strong" : hits.length ? "partial" : "missing",
      evidence: hits,
      note: inSkills
        ? "Found in Skills."
        : hits.length
          ? `Found in ${[...new Set(hits.map((h) => h.section))].join(" and ")}.`
          : "No confirmed evidence on this resume.",
    });
  }
  for (const skill of preferred) {
    const hits = findEvidence(resume, skill);
    evidence.push({
      requirement: skill,
      kind: "preferred_skill",
      status: hits.length ? "strong" : "missing",
      evidence: hits,
      note: hits.length
        ? "Preferred qualification with supporting resume evidence."
        : "Preferred, not required. Missing evidence is not treated as a fail.",
    });
  }

  const yearsRequired = extractYearsRequired(job.descriptionText ?? "");
  const yearsConfirmed = confirmedExperienceYears(resume);
  if (yearsRequired != null) {
    evidence.push({
      requirement: `${yearsRequired} years of experience`,
      kind: "experience",
      status:
        yearsConfirmed == null
          ? "insufficient"
          : yearsConfirmed >= yearsRequired
            ? "strong"
            : "missing",
      evidence:
        yearsConfirmed == null
          ? []
          : [{ section: "experience", text: `${yearsConfirmed} confirmed calendar years from dated roles.` }],
      note:
        yearsConfirmed == null
          ? "Insufficient confirmed evidence — employment dates were not present or were not confirmed."
          : yearsConfirmed >= yearsRequired
            ? "Dated roles cover the stated duration. Dates were not inferred."
            : "Dated roles cover fewer calendar years than the listing asks for.",
    });
  }

  const educationNeed = /\b(bachelor|master|degree|b\.tech|btech|phd)\b/i.test(job.descriptionText ?? "");
  if (educationNeed) {
    const hasEducation = resume.education.some((row) => row.school || row.credential);
    evidence.push({
      requirement: "Education listed in the job description",
      kind: "education",
      status: hasEducation ? "partial" : "insufficient",
      evidence: resume.education
        .filter((row) => row.school || row.credential)
        .map((row) => ({
          section: "education",
          text: [row.credential, row.field, row.school].filter(Boolean).join(", "),
        })),
      note: hasEducation
        ? "Education appears on the resume. HireFlow does not verify that it satisfies the listing."
        : "The listing mentions a degree, but this resume has no confirmed education section.",
    });
  }

  const suggestedImprovements: string[] = [];
  for (const row of evidence) {
    if (row.kind === "required_skill" && row.status === "missing") {
      suggestedImprovements.push(
        `If you have used ${row.requirement}, add it only where it is true — in Skills or a project bullet. Do not invent it.`,
      );
    }
    if (row.kind === "required_skill" && row.status === "partial") {
      suggestedImprovements.push(
        `${row.requirement} appears outside Skills. Consider listing it under Skills if it is a core capability.`,
      );
    }
  }
  if (!resume.personal.summary?.trim()) {
    suggestedImprovements.push("Add a short summary that uses job titles and skills already on this resume.");
  }

  return {
    ...base,
    needsMoreProfile: skills.length === 0 && titles.length === 0,
    evidence,
    suggestedImprovements,
    methodology:
      "Compatibility is deterministic overlap of resume evidence with listing fields. Preferred skills are never scored as mandatory. Missing dates are reported as insufficient evidence, not as a fabricated tenure. This is not a probability of getting hired.",
  };
}
