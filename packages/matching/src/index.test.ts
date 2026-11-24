import { describe, expect, it } from "vitest";
import { explainMatch } from "./explain";

describe("explainMatch", () => {
  it("never frames the score as a hire probability", () => {
    const result = explainMatch({
      profileSkills: ["TypeScript"],
      jobSkills: ["TypeScript", "Go"],
      profileTitles: ["Software Engineer"],
      jobTitle: "Software Engineer",
      remoteOk: true,
    });
    expect(result.disclaimer.toLowerCase()).toContain("not a probability");
    expect(result.overall ?? 0).toBeGreaterThan(0);
  });

  it("refuses to invent a score when the profile has no titles or skills", () => {
    const result = explainMatch({
      profileSkills: [],
      jobSkills: ["TypeScript"],
      profileTitles: [],
      jobTitle: "Engineer",
    });
    expect(result.needsMoreProfile).toBe(true);
    expect(result.overall).toBeNull();
  });
});
