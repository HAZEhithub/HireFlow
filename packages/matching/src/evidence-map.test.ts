import { describe, expect, it } from "vitest";
import { attachVaultQuotes } from "./evidence-map";
import type { RequirementEvidence } from "./resume-job";

describe("attachVaultQuotes", () => {
  it("marks vault quotes as user-provided and does not invent them", () => {
    const evidence: RequirementEvidence[] = [
      {
        requirement: "TypeScript",
        kind: "required_skill",
        status: "missing",
        evidence: [],
        note: "No confirmed evidence on this resume.",
      },
    ];
    const items = attachVaultQuotes(evidence, [
      {
        id: "v1",
        title: "Campus TypeScript project",
        body: "Built a TypeScript CLI.",
        quotedAs: "user-provided",
      },
    ]);
    expect(items[0]?.vaultQuotes[0]?.quotedAs).toBe("user-provided");
    expect(items[0]?.vaultQuotes[0]?.excerpt).toContain("TypeScript");
  });
});
