import { describe, expect, it } from "vitest";
import { FREE_AI_ASSISTS_PER_MONTH, MAX_FREE_RESUMES } from "./constants";

describe("plan limits", () => {
  it("does not advertise unlimited AI", () => {
    expect(FREE_AI_ASSISTS_PER_MONTH).toBe(5);
    expect(MAX_FREE_RESUMES).toBe(2);
  });
});
