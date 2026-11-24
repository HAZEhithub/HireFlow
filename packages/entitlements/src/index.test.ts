import { describe, expect, it } from "vitest";
import {
  BILLING_LIVE,
  ENTITLEMENTS,
  PLANS,
  assertEntitlement,
  publicCatalog,
  resolvePlan,
} from "./index";

describe("entitlements", () => {
  it("keeps billing off and everyone on Free", () => {
    expect(BILLING_LIVE).toBe(false);
    expect(PLANS.pro.priceInrExGst).toBe(199);
    expect(resolvePlan("any-user").plan).toBe("free");
    expect(resolvePlan("any-user").status).toBe("none");
  });

  it("allows implemented Free surfaces", async () => {
    const result = await assertEntitlement("user-1", "profile.read_write");
    expect(result.plan).toBe("free");
  });

  it("does not grant unimplemented or research keys", async () => {
    await expect(assertEntitlement("user-1", "resume.cover_letter")).rejects.toMatchObject({
      code: "NOT_IMPLEMENTED",
    });
    await expect(assertEntitlement("user-1", "research.mentor_marketplace")).rejects.toMatchObject({
      code: "NOT_GRANTABLE",
    });
  });

  it("allows Phase 3 resume studio on Free", async () => {
    await expect(assertEntitlement("user-1", "resumes.parse_export")).resolves.toMatchObject({ plan: "free" });
    await expect(assertEntitlement("user-1", "resume.tailoring")).resolves.toMatchObject({ plan: "free" });
    await expect(assertEntitlement("user-1", "resumes.max_versions", { used: 1, increment: 1 })).resolves.toMatchObject({
      remaining: 0,
    });
    await expect(assertEntitlement("user-1", "resumes.max_versions", { used: 2, increment: 1 })).rejects.toMatchObject({
      code: "QUOTA_EXCEEDED",
    });
  });

  it("hides non-grantable research keys from the public catalog", () => {
    const catalog = publicCatalog();
    expect(catalog.billingLive).toBe(false);
    expect(catalog.plans.pro.checkoutEnabled).toBe(false);
    expect(catalog.entitlements.some((row) => row.key.startsWith("research."))).toBe(false);
    expect(ENTITLEMENTS.some((row) => row.key === "research.portfolio" && !row.grantable)).toBe(true);
  });
});
