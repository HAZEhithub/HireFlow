import { describe, expect, it } from "vitest";
import { APPLICATION_STAGES, FREE_AI_ASSISTS_PER_MONTH, MAX_FREE_EVIDENCE, MAX_FREE_RESUMES } from "./constants";

describe("plan limits", () => {
  it("does not advertise unlimited AI", () => {
    expect(FREE_AI_ASSISTS_PER_MONTH).toBe(5);
    expect(MAX_FREE_RESUMES).toBe(2);
    expect(MAX_FREE_EVIDENCE).toBe(10);
    expect(APPLICATION_STAGES).toEqual([
      "saved",
      "preparing",
      "applied",
      "interview",
      "offer",
      "rejected",
      "withdrawn",
    ]);
  });
});
