import { describe, expect, it } from "vitest";
import { evaluateFreshness, nextMissingStatus } from "./freshness";

const now = new Date("2026-11-21T00:00:00.000Z");

describe("freshness", () => {
  it("does not treat an old publication date as a new posting", () => {
    const result = evaluateFreshness({
      now,
      firstSeen: now,
      lastVerified: now,
      publishedAt: new Date("2025-01-01T00:00:00.000Z"),
      status: "open",
      missingConsecutive: 0,
    });
    expect(result.label).toBe("recently_checked");
    expect(result.explanation.toLowerCase()).toContain("not a new posting");
  });

  it("keeps a recently retrieved new listing as fresh", () => {
    const result = evaluateFreshness({
      now,
      firstSeen: now,
      lastVerified: now,
      publishedAt: now,
      status: "open",
      missingConsecutive: 0,
    });
    expect(result.label).toBe("fresh");
  });

  it("marks stale after a week without a successful check", () => {
    const result = evaluateFreshness({
      now,
      firstSeen: new Date("2026-10-01T00:00:00.000Z"),
      lastVerified: new Date("2026-11-01T00:00:00.000Z"),
      status: "open",
      missingConsecutive: 0,
    });
    expect(result.label).toBe("stale");
  });

  it("does not expire on a single failed request or a single missing listing", () => {
    const failed = evaluateFreshness({
      now,
      firstSeen: now,
      lastVerified: now,
      status: "open",
      missingConsecutive: 0,
      lastRunFailed: true,
    });
    expect(failed.label).toBe("source_error");
    expect(nextMissingStatus(0)).toMatchObject({ missingConsecutive: 1, status: "open" });
    expect(nextMissingStatus(1)).toMatchObject({ status: "expired" });
  });
});
