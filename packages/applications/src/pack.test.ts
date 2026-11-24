import { describe, expect, it } from "vitest";
import { APPLICATION_PACK_SLOTS, applicationPackForJob } from "./pack";

describe("application pack assemble", () => {
  it("exposes paste slots and never claims AI drafts or auto-submit", () => {
    const pack = applicationPackForJob({ jobId: "job-1", applicationId: "app-1" });
    expect(pack.slots.map((slot) => slot.id)).toEqual(APPLICATION_PACK_SLOTS.map((slot) => slot.id));
    expect(pack.slots.every((slot) => slot.assemble && !slot.aiDrafts)).toBe(true);
    expect(pack.note).toMatch(/will not submit/i);
  });
});
