import { randomUUID } from "node:crypto";
import type { StructuredResume } from "@hireflow/shared";
import { flattenResumeSkills, matchResumeToJob } from "@hireflow/matching";

export type TailorDecision = "accept" | "reject" | "edit";

export type TailorSuggestion = {
  id: string;
  kind: "section_order" | "skills_emphasis" | "summary" | "keyword_coverage" | "project_emphasis" | "bullet_clarity";
  path: string;
  before: string;
  after: string;
  rationale: string;
  invented: false;
};

export type TailorPlan = {
  suggestions: TailorSuggestion[];
  warnings: string[];
};

function cloneResume(resume: StructuredResume): StructuredResume {
  return structuredClone(resume);
}

function skillSet(resume: StructuredResume) {
  return new Set(flattenResumeSkills(resume).map((item) => item.toLowerCase()));
}

export function buildTailorPlan(
  resume: StructuredResume,
  job: {
    title: string;
    requiredSkills?: string[] | null;
    preferredSkills?: string[] | null;
    descriptionText?: string | null;
    workplaceType?: string | null;
    employmentType?: string | null;
    locationText?: string | null;
    city?: string | null;
    seniority?: string | null;
  },
): TailorPlan {
  const suggestions: TailorSuggestion[] = [];
  const warnings: string[] = [];
  const compatibility = matchResumeToJob(resume, job);
  const have = skillSet(resume);
  const required = job.requiredSkills ?? [];
  const presentRequired = required.filter((skill) => have.has(skill.toLowerCase()));
  const mentionedElsewhere = compatibility.evidence.filter(
    (row) => row.kind === "required_skill" && row.status === "partial",
  );

  if (presentRequired.length) {
    const current = flattenResumeSkills(resume).join(", ");
    const reordered = [
      ...presentRequired,
      ...flattenResumeSkills(resume).filter(
        (item) => !presentRequired.some((skill) => skill.toLowerCase() === item.toLowerCase()),
      ),
    ];
    suggestions.push({
      id: randomUUID(),
      kind: "skills_emphasis",
      path: "skills[0].items",
      before: current,
      after: reordered.join(", "),
      rationale: "Move skills that already appear on this resume and in the listing toward the front. No new skills are added.",
      invented: false,
    });
  }

  if (mentionedElsewhere.length) {
    const extras = mentionedElsewhere.map((row) => row.requirement);
    const current = flattenResumeSkills(resume).join(", ");
    suggestions.push({
      id: randomUUID(),
      kind: "keyword_coverage",
      path: "skills[0].items",
      before: current,
      after: [...flattenResumeSkills(resume), ...extras].join(", "),
      rationale: `These terms already appear in ${mentionedElsewhere
        .flatMap((row) => row.evidence.map((item) => item.section))
        .filter((value, index, list) => list.indexOf(value) === index)
        .join(", ") || "another section"}. Listing them under Skills does not invent experience.`,
      invented: false,
    });
  }

  const missing = required.filter((skill) => !have.has(skill.toLowerCase()) && !mentionedElsewhere.some((row) => row.requirement === skill));
  if (missing.length) {
    warnings.push(
      `The listing asks for ${missing.join(", ")}, which this resume does not mention. HireFlow will not add them.`,
    );
  }

  if (resume.personal.summary?.trim()) {
    const usable = [...presentRequired, ...flattenResumeTitles(resume)].slice(0, 6);
    if (usable.length) {
      const after = `${resume.personal.headline || flattenResumeTitles(resume)[0] || "Candidate"} with experience in ${usable.join(", ")}. ${resume.personal.summary.trim()}`;
      suggestions.push({
        id: randomUUID(),
        kind: "summary",
        path: "personal.summary",
        before: resume.personal.summary,
        after: after.slice(0, 800),
        rationale: "Lead the existing summary with titles and skills already on this resume that also appear in the listing.",
        invented: false,
      });
    }
  } else if (presentRequired.length || flattenResumeTitles(resume).length) {
    suggestions.push({
      id: randomUUID(),
      kind: "summary",
      path: "personal.summary",
      before: "",
      after: `${flattenResumeTitles(resume)[0] || "Professional"} focusing on ${presentRequired.slice(0, 4).join(", ") || flattenResumeSkills(resume).slice(0, 4).join(", ")}.`.slice(0, 400),
      rationale: "Drafted only from headlines and skills already present on this resume.",
      invented: false,
    });
  }

  const intern = /intern/i.test(job.title);
  if (intern && resume.sectionOrder[0] !== "projects" && resume.projects.length) {
    const next = ["projects", ...resume.sectionOrder.filter((id) => id !== "projects")];
    suggestions.push({
      id: randomUUID(),
      kind: "section_order",
      path: "sectionOrder",
      before: resume.sectionOrder.join(", "),
      after: next.join(", "),
      rationale: "Internship listings often read project evidence first. This only reorders existing sections.",
      invented: false,
    });
  } else if (presentRequired.length && resume.sectionOrder[0] !== "skills") {
    const next = ["skills", ...resume.sectionOrder.filter((id) => id !== "skills")];
    suggestions.push({
      id: randomUUID(),
      kind: "section_order",
      path: "sectionOrder",
      before: resume.sectionOrder.join(", "),
      after: next.join(", "),
      rationale: "Lead with skills that already exist on this resume.",
      invented: false,
    });
  }

  if (resume.projects.length && required.length) {
    const project = resume.projects[0];
    if (project && !project.technologies.length && presentRequired.length) {
      suggestions.push({
        id: randomUUID(),
        kind: "project_emphasis",
        path: `projects[0].technologies`,
        before: project.technologies.join(", "),
        after: presentRequired.join(", "),
        rationale: "Adds technologies already listed in Skills / the listing only if they are already on this resume.",
        invented: false,
      });
    }
  }

  for (const exp of resume.experience) {
    for (const [index, bullet] of exp.responsibilities.entries()) {
      if (/worked on\b/i.test(bullet)) {
        suggestions.push({
          id: randomUUID(),
          kind: "bullet_clarity",
          path: `experience.${exp.id}.responsibilities.${index}`,
          before: bullet,
          after: bullet.replace(/worked on/i, "Built"),
          rationale: "Clearer verb. Confirm this still matches what you actually did.",
          invented: false,
        });
      }
    }
  }

  return { suggestions: suggestions.slice(0, 16), warnings };
}

function flattenResumeTitles(resume: StructuredResume) {
  return [resume.personal.headline, ...resume.experience.map((row) => row.title)].filter(
    (item): item is string => Boolean(item?.trim()),
  );
}

export function applyTailorDecisions(
  resume: StructuredResume,
  suggestions: TailorSuggestion[],
  decisions: Record<string, TailorDecision>,
  edits?: Record<string, string>,
): StructuredResume {
  const next = cloneResume(resume);
  for (const suggestion of suggestions) {
    const decision = decisions[suggestion.id];
    if (decision !== "accept" && decision !== "edit") continue;
    const value = decision === "edit" && edits?.[suggestion.id] ? edits[suggestion.id] : suggestion.after;
    if (!value) continue;
    if (suggestion.path === "personal.summary") next.personal.summary = value;
    else if (suggestion.path === "skills[0].items") {
      const items = value.split(",").map((item) => item.trim()).filter(Boolean);
      if (!next.skills[0]) next.skills = [{ id: randomUUID(), category: "", items }];
      else next.skills[0].items = items;
    } else if (suggestion.path === "sectionOrder") {
      const order = value.split(",").map((item) => item.trim());
      next.sectionOrder = next.sectionOrder.filter((id) => order.includes(id));
      const extras = order.filter((id) => next.sectionOrder.includes(id as never));
      if (extras.length) next.sectionOrder = order as StructuredResume["sectionOrder"];
    } else if (suggestion.path === "projects[0].technologies" && next.projects[0]) {
      next.projects[0].technologies = value.split(",").map((item) => item.trim()).filter(Boolean);
    } else if (suggestion.path.includes("responsibilities")) {
      const match = suggestion.path.match(/^experience\.(.+)\.responsibilities\.(\d+)$/);
      if (match) {
        const exp = next.experience.find((row) => row.id === match[1]);
        const index = Number(match[2]);
        if (exp && Number.isInteger(index) && exp.responsibilities[index] != null) {
          exp.responsibilities[index] = value;
        }
      }
    }
  }
  return next;
}

export function assertNoFabrication(original: StructuredResume, tailored: StructuredResume) {
  const originalSkills = skillSet(original);
  const originalText = JSON.stringify(original).toLowerCase();
  for (const skill of flattenResumeSkills(tailored)) {
    if (!originalSkills.has(skill.toLowerCase()) && !originalText.includes(skill.toLowerCase())) {
      throw new Error(`refusing to add unsupported skill: ${skill}`);
    }
  }
  for (const exp of tailored.experience) {
    const source = original.experience.find((row) => row.id === exp.id);
    if (!source) continue;
    if ((source.startDate || "") !== (exp.startDate || "") || (source.endDate || "") !== (exp.endDate || "")) {
      throw new Error("refusing to change employment dates");
    }
    if (source.company !== exp.company) throw new Error("refusing to change company names");
  }
}
