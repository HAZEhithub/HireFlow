import {
  COMPLETENESS_SCORE_DEFINITION,
  type StructuredResume,
} from "@hireflow/shared";

export type AnalysisFinding = {
  id: string;
  severity: "info" | "improve" | "missing";
  area: string;
  title: string;
  detail: string;
  exampleBefore?: string;
  exampleAfter?: string;
  requiresUserFact?: boolean;
};

export type ResumeAnalysisResult = {
  completeness: number;
  scoreDefinition: string;
  findings: AnalysisFinding[];
  limitations: string[];
};

const WEAK_PHRASES = [
  /worked on\b/i,
  /responsible for\b/i,
  /helped with\b/i,
  /involved in\b/i,
];

function hasContact(resume: StructuredResume) {
  return Boolean(resume.personal.email || resume.personal.phone);
}

function allBullets(resume: StructuredResume) {
  return [
    ...resume.experience.flatMap((row) => [...row.responsibilities, ...row.achievements]),
    ...resume.projects.flatMap((row) => row.bullets),
  ];
}

export function analyzeResume(resume: StructuredResume): ResumeAnalysisResult {
  const findings: AnalysisFinding[] = [];
  let score = 0;
  const add = (points: number, ok: boolean) => {
    if (ok) score += points;
  };

  add(15, Boolean(resume.personal.fullName?.trim()));
  add(15, hasContact(resume));
  add(10, Boolean(resume.personal.location?.trim()));
  add(10, Boolean(resume.personal.summary?.trim()) && (resume.personal.summary?.trim().length ?? 0) >= 40);
  add(15, resume.skills.some((group) => group.items.length > 0));
  add(20, resume.experience.length > 0);
  add(10, resume.education.length > 0);
  add(5, resume.projects.length > 0);

  if (!resume.personal.fullName?.trim()) {
    findings.push({
      id: "name",
      severity: "missing",
      area: "contact",
      title: "Name is missing",
      detail: "Add your name so a recruiter can identify the document.",
    });
  }
  if (!resume.personal.email?.trim()) {
    findings.push({
      id: "email",
      severity: "missing",
      area: "contact",
      title: "Email is missing",
      detail: "Include a contact email. HireFlow will not invent one.",
    });
  }
  if (!resume.personal.phone?.trim()) {
    findings.push({
      id: "phone",
      severity: "improve",
      area: "contact",
      title: "Phone number is missing",
      detail: "Optional, but many employers still expect a phone number.",
    });
  }
  if (!resume.personal.summary?.trim()) {
    findings.push({
      id: "summary",
      severity: "improve",
      area: "summary",
      title: "Professional summary is empty",
      detail: "Write 2–3 sentences using job titles and skills that already appear on this resume.",
    });
  } else if ((resume.personal.summary?.trim().length ?? 0) < 40) {
    findings.push({
      id: "summary-short",
      severity: "improve",
      area: "summary",
      title: "Summary is very short",
      detail: "A brief headline is fine; a two-sentence summary usually reads more clearly.",
    });
  }

  if (!resume.skills.some((group) => group.items.length)) {
    findings.push({
      id: "skills",
      severity: "missing",
      area: "skills",
      title: "No skills listed",
      detail: "Add skills you actually use. Do not add keywords from a job listing unless they are true.",
    });
  }

  if (!resume.experience.length) {
    findings.push({
      id: "experience",
      severity: "missing",
      area: "experience",
      title: "No work experience section",
      detail: "If you have internships, freelance, or project-based work, add those with real dates.",
    });
  }

  for (const exp of resume.experience) {
    if (!exp.startDate && !exp.endDate) {
      findings.push({
        id: `dates-${exp.id}`,
        severity: "improve",
        area: "experience",
        title: `No dates for ${exp.title || "a role"}`,
        detail: "HireFlow does not infer employment dates. Add them only if you know them.",
      });
    }
    const bullets = [...exp.responsibilities, ...exp.achievements];
    if (!bullets.length) {
      findings.push({
        id: `bullets-${exp.id}`,
        severity: "improve",
        area: "experience",
        title: `${exp.title || "A role"} has no bullets`,
        detail: "Describe what you built, owned, or shipped. Do not invent metrics.",
      });
    }
  }

  for (const bullet of allBullets(resume)) {
    if (WEAK_PHRASES.some((pattern) => pattern.test(bullet)) || bullet.split(" ").length < 6) {
      findings.push({
        id: `weak-${bullet.slice(0, 24)}`,
        severity: "improve",
        area: "experience",
        title: "Vague achievement language",
        detail: "Replace generic phrasing with the actual system, tool, and outcome you can stand behind.",
        exampleBefore: bullet,
        exampleAfter: bullet.replace(/worked on/i, "Built").replace(/responsible for/i, "Owned"),
        requiresUserFact: true,
      });
    }
    if (/\d+%|increased|decreased|revenue|\$|₹/.test(bullet) === false && /impact|improved|optimized/i.test(bullet)) {
      findings.push({
        id: `metric-${bullet.slice(0, 20)}`,
        severity: "info",
        area: "experience",
        title: "Outcome without a confirmed metric",
        detail: "If you have a real number, add it. HireFlow will not invent performance or revenue figures.",
        requiresUserFact: true,
      });
    }
  }

  if (!resume.projects.length && resume.experience.length <= 1) {
    findings.push({
      id: "projects",
      severity: "improve",
      area: "projects",
      title: "No projects listed",
      detail: "For early-career roles, a project with a tech stack and a concrete result often helps.",
    });
  }

  const uniqueFindings = findings.filter(
    (row, index, list) => list.findIndex((item) => item.title === row.title && item.detail === row.detail) === index,
  );

  return {
    completeness: Math.min(100, score),
    scoreDefinition: COMPLETENESS_SCORE_DEFINITION,
    findings: uniqueFindings.slice(0, 40),
    limitations: [
      "This is not an ATS compatibility score and not a hiring probability.",
      "Suggestions marked as requiring a user fact must be confirmed before they are added.",
      "Formatting issues in a scanned or multi-column original may not appear here after extraction.",
    ],
  };
}
