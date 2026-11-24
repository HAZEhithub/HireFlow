import { afterEach, describe, expect, it } from "vitest";
import {
  BILLING_LIVE,
  ENTITLEMENTS,
  PLANS,
  assertEntitlement,
  publicCatalog,
  resolvePlan,
  setBillingLiveForTests,
  setPlanResolverForTests,
} from "./index";

afterEach(() => {
  setBillingLiveForTests(null);
  setPlanResolverForTests(null);
});

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

  it("allows the unlimited Free tracker and follow-ups", async () => {
    await expect(assertEntitlement("user-1", "applications.tracker")).resolves.toMatchObject({ plan: "free" });
    await expect(assertEntitlement("user-1", "applications.follow_ups")).resolves.toMatchObject({ plan: "free" });
    await expect(assertEntitlement("user-1", "applications.pack")).resolves.toMatchObject({ plan: "free" });
    await expect(assertEntitlement("user-1", "evidence.vault_items", { used: 9, increment: 1 })).resolves.toMatchObject({
      remaining: 0,
    });
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
    expect(catalog.plans.pro.indicativeUsdHypothesis).toBe(9);
    expect(catalog.entitlements.some((row) => row.key.startsWith("research."))).toBe(false);
    expect(ENTITLEMENTS.some((row) => row.key === "research.portfolio" && !row.grantable)).toBe(true);
  });

  it("grants implemented Phase 6 keys as complimentary Pro while billing is off", async () => {
    await expect(assertEntitlement("user-1", "matching.evidence_map")).resolves.toMatchObject({
      plan: "pro",
      billedPlan: "free",
    });
    await expect(assertEntitlement("user-1", "prepare.company_brief")).resolves.toMatchObject({ plan: "pro" });
    await expect(assertEntitlement("user-1", "applications.analytics")).resolves.toMatchObject({ plan: "pro" });
  });

  it("returns PLAN_REQUIRED for complimentary keys when billing is mocked live on Free", async () => {
    setBillingLiveForTests(true);
    await expect(assertEntitlement("user-1", "matching.evidence_map")).rejects.toMatchObject({
      code: "PLAN_REQUIRED",
      httpStatus: 403,
    });
  });

  it("returns 501 for unimplemented Pro identifiers", async () => {
    await expect(assertEntitlement("user-1", "resume.cover_letter")).rejects.toMatchObject({
      code: "NOT_IMPLEMENTED",
      httpStatus: 501,
    });
    await expect(assertEntitlement("user-1", "prepare.interview")).rejects.toMatchObject({
      code: "NOT_IMPLEMENTED",
      httpStatus: 501,
    });
  });

  it("uses an injected Pro resolver for quota math without trusting a client plan", async () => {
    setBillingLiveForTests(true);
    setPlanResolverForTests(() => ({
      plan: "pro",
      status: "active",
      billingLive: true,
      currentPeriodEnd: null,
    }));
    await expect(assertEntitlement("user-1", "ai.assists_per_month", { used: 49, increment: 1 })).resolves.toMatchObject({
      remaining: 0,
      plan: "pro",
    });
    await expect(assertEntitlement("user-1", "ai.assists_per_month", { used: 50, increment: 1 })).rejects.toMatchObject({
      code: "QUOTA_EXCEEDED",
    });
    await expect(assertEntitlement("user-1", "evidence.vault_items", { used: 10, increment: 1 })).resolves.toMatchObject({
      remaining: 39,
    });
    await expect(assertEntitlement("user-1", "resumes.max_versions", { used: 2, increment: 1 })).resolves.toMatchObject({
      remaining: "unlimited",
    });
  });
});
