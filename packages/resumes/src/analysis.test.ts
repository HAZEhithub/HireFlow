import { describe, expect, it } from "vitest";
import { emptyStructuredResume } from "@hireflow/shared";
import { analyzeResume } from "./analysis";

describe("resume analysis", () => {
  it("scores a missing resume transparently and does not invent an ATS score", () => {
    const result = analyzeResume(emptyStructuredResume());
    expect(result.completeness).toBe(0);
    expect(result.scoreDefinition.toLowerCase()).toContain("not an ats");
    expect(result.findings.some((item) => item.area === "contact")).toBe(true);
  });

  it("flags vague bullets and asks for real outcomes", () => {
    const resume = emptyStructuredResume();
    resume.personal.fullName = "Asha Raman";
    resume.personal.email = "asha.raman@example.com";
    resume.personal.summary = "Backend engineer building APIs in TypeScript.";
    resume.skills = [{ id: "s1", category: "", items: ["TypeScript"] }];
    resume.experience = [
      {
        id: "e1",
        title: "Engineer",
        company: "Northwind",
        location: "",
        startDate: "2022",
        endDate: "Present",
        responsibilities: ["Worked on machine learning projects."],
        achievements: [],
      },
    ];
    resume.education = [{ id: "ed1", school: "NIT", credential: "B.Tech", field: "", location: "", startDate: "", endDate: "", details: [] }];
    const result = analyzeResume(resume);
    expect(result.completeness).toBeGreaterThan(50);
    const vague = result.findings.find((item) => item.exampleBefore?.includes("Worked on"));
    expect(vague?.exampleAfter).toContain("Built");
    expect(vague?.requiresUserFact).toBe(true);
  });
});
