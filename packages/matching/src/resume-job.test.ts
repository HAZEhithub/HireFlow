import { describe, expect, it } from "vitest";
import { emptyStructuredResume } from "@hireflow/shared";
import { matchResumeToJob } from "./resume-job";

describe("matchResumeToJob", () => {
  it("explains required vs preferred skills and does not treat preferred as mandatory", () => {
    const resume = emptyStructuredResume();
    resume.personal.headline = "Software Engineer";
    resume.skills = [{ id: "s1", category: "", items: ["TypeScript", "SQL"] }];
    resume.projects = [
      {
        id: "p1",
        name: "Classifier",
        url: "",
        summary: "Python classification prototype",
        bullets: [],
        technologies: ["Python"],
      },
    ];
    const result = matchResumeToJob(resume, {
      title: "Software Engineer",
      requiredSkills: ["TypeScript", "Python"],
      preferredSkills: ["Go"],
      descriptionText: "3 years of experience. Required TypeScript.",
    });
    expect(result.disclaimer.toLowerCase()).toContain("not a probability");
    expect(result.evidence.find((row) => row.requirement === "TypeScript")?.status).toBe("strong");
    expect(result.evidence.find((row) => row.requirement === "Python")?.status).toBe("partial");
    expect(result.evidence.find((row) => row.requirement === "Go")?.kind).toBe("preferred_skill");
    expect(result.evidence.find((row) => row.requirement === "Go")?.note.toLowerCase()).toContain("not required");
  });

  it("reports insufficient evidence when dates are missing", () => {
    const resume = emptyStructuredResume();
    resume.skills = [{ id: "s1", category: "", items: ["TypeScript"] }];
    const result = matchResumeToJob(resume, {
      title: "Engineer",
      requiredSkills: ["TypeScript"],
      descriptionText: "3 years of experience required.",
    });
    const years = result.evidence.find((row) => row.kind === "experience");
    expect(years?.status).toBe("insufficient");
  });
});
