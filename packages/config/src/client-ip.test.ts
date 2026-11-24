import { describe, expect, it } from "vitest";
import { rateLimitSubject } from "./client-ip";

describe("rateLimitSubject", () => {
  it("ignores client-supplied forwarding headers by default", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9" });
    expect(rateLimitSubject(headers, "local", {})).toBe("local");
  });

  it("uses the forwarded address only when TRUST_PROXY is set", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(rateLimitSubject(headers, "local", { TRUST_PROXY: "true" })).toBe("203.0.113.9");
  });
});
