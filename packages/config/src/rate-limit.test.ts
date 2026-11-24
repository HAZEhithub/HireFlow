import { describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  it("blocks after the window fills", () => {
    resetRateLimits();
    const key = "auth:test";
    expect(rateLimit({ key, limit: 2, windowMs: 60_000, now: 1 }).ok).toBe(true);
    expect(rateLimit({ key, limit: 2, windowMs: 60_000, now: 2 }).ok).toBe(true);
    expect(rateLimit({ key, limit: 2, windowMs: 60_000, now: 3 }).ok).toBe(false);
  });
});
