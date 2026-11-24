import { describe, expect, it } from "vitest";
import { DEV_AUTH_SECRET_FALLBACK, resolveAuthSecret } from "./auth-secret";

describe("resolveAuthSecret", () => {
  it("allows the development fallback", () => {
    expect(resolveAuthSecret({ NODE_ENV: "development" })).toBe(DEV_AUTH_SECRET_FALLBACK);
  });

  it("refuses production without a unique secret", () => {
    expect(() => resolveAuthSecret({ NODE_ENV: "production" })).toThrow(/BETTER_AUTH_SECRET/);
    expect(() =>
      resolveAuthSecret({ NODE_ENV: "production", BETTER_AUTH_SECRET: DEV_AUTH_SECRET_FALLBACK }),
    ).toThrow(/BETTER_AUTH_SECRET/);
    expect(() => resolveAuthSecret({ NODE_ENV: "production", BETTER_AUTH_SECRET: "short" })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
  });

  it("accepts a unique production secret", () => {
    const secret = "production-secret-must-be-32-chars";
    expect(resolveAuthSecret({ NODE_ENV: "production", BETTER_AUTH_SECRET: secret })).toBe(secret);
  });
});
