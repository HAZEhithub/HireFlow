import { describe, expect, it } from "vitest";
import { emptyStructuredResume } from "@hireflow/shared";
import { applyTailorDecisions, assertNoFabrication, buildTailorPlan } from "./tailor";

function sampleResume() {
  const resume = emptyStructuredResume();
  resume.personal.fullName = "Asha Raman";
  resume.personal.headline = "Software Engineer";
  resume.personal.summary = "Builds TypeScript services.";
  resume.skills = [{ id: "s1", category: "", items: ["TypeScript", "PostgreSQL"] }];
  resume.experience = [
    {
      id: "e1",
      title: "Software Engineer",
      company: "Northwind Labs",
      location: "Bengaluru",
      startDate: "Jan 2022",
      endDate: "Present",
      responsibilities: ["Worked on billing APIs."],
      achievements: [],
    },
  ];
  resume.projects = [
    {
      id: "p1",
      name: "Campus Jobs Board",
      url: "",
      summary: "Matching internships using TypeScript.",
      bullets: ["Used PostgreSQL for listings."],
      technologies: [],
    },
  ];
  return resume;
}

describe("resume tailoring", () => {
  it("does not invent missing skills and keeps dates intact", () => {
    const resume = sampleResume();
    const plan = buildTailorPlan(resume, {
      title: "Software Engineering Intern",
      requiredSkills: ["TypeScript", "Python"],
      preferredSkills: ["React"],
      descriptionText: "Required: TypeScript, Python. Preferred: React.",
    });
    expect(plan.warnings.some((line) => line.includes("Python"))).toBe(true);
    expect(plan.suggestions.every((item) => item.invented === false)).toBe(true);
    expect(plan.suggestions.some((item) => item.after.includes("Python"))).toBe(false);
  });

  it("applies accepted suggestions only and preserves the original", () => {
    const resume = sampleResume();
    const plan = buildTailorPlan(resume, {
      title: "Backend Engineer",
      requiredSkills: ["TypeScript", "PostgreSQL"],
    });
    const first = plan.suggestions[0];
    expect(first).toBeTruthy();
    const decisions = Object.fromEntries(plan.suggestions.map((item) => [item.id, item.id === first?.id ? "accept" : "reject"]));
    const tailored = applyTailorDecisions(resume, plan.suggestions, decisions);
    assertNoFabrication(resume, tailored);
    expect(resume.personal.summary).toBe("Builds TypeScript services.");
    expect(tailored.experience[0]?.startDate).toBe("Jan 2022");
    expect(tailored.experience[0]?.company).toBe("Northwind Labs");
  });
});
