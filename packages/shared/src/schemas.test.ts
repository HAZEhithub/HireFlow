import { describe, expect, it } from "vitest";
import { emptyStructuredResume, structuredResumeSchema } from "./resume";
import { profileSchema, settingsSchema } from "./schemas";

describe("profileSchema", () => {
  it("accepts incremental profile updates", () => {
    const parsed = profileSchema.parse({
      headline: "Intern",
      skills: ["Python"],
      openToInternships: true,
    });
    expect(parsed.headline).toBe("Intern");
    expect(parsed.openToInternships).toBe(true);
  });

  it("rejects invalid employment types and oversized headlines", () => {
    expect(profileSchema.safeParse({ employmentTypes: ["contractor"] }).success).toBe(false);
    expect(profileSchema.safeParse({ headline: "x".repeat(161) }).success).toBe(false);
  });
});

describe("structuredResumeSchema", () => {
  it("accepts an empty resume and rejects invented oversized fields", () => {
    expect(structuredResumeSchema.parse(emptyStructuredResume()).experience).toEqual([]);
    expect(
      structuredResumeSchema.safeParse({
        ...emptyStructuredResume(),
        personal: { ...emptyStructuredResume().personal, email: "x".repeat(200) },
      }).success,
    ).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("keeps AI consent explicit", () => {
    const parsed = settingsSchema.parse({ aiExternalConsent: false, aiPaidConsent: false });
    expect(parsed.aiExternalConsent).toBe(false);
    expect(parsed.aiPaidConsent).toBe(false);
  });
});
