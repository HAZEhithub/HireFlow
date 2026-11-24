import {
  BILLING_LIVE,
  ENTITLEMENTS,
  PLANS,
  type EntitlementKey,
  type LimitValue,
  type PlanId,
  type SubscriptionStatus,
  entitlement,
  limitFor,
} from "./catalog";

export type EntitlementCode = "NOT_IMPLEMENTED" | "NOT_GRANTABLE" | "PLAN_REQUIRED" | "QUOTA_EXCEEDED";

export class EntitlementError extends Error {
  readonly code: EntitlementCode;
  readonly key: EntitlementKey;
  readonly plan: PlanId;
  readonly limit: LimitValue;
  readonly used?: number;
  readonly httpStatus: 403 | 404 | 429 | 501;

  constructor(init: {
    code: EntitlementCode;
    key: EntitlementKey;
    plan: PlanId;
    limit: LimitValue;
    used?: number;
  }) {
    super(init.code);
    this.name = "EntitlementError";
    this.code = init.code;
    this.key = init.key;
    this.plan = init.plan;
    this.limit = init.limit;
    this.used = init.used;
    this.httpStatus =
      init.code === "NOT_IMPLEMENTED" ? 501
      : init.code === "NOT_GRANTABLE" ? 404
      : init.code === "QUOTA_EXCEEDED" ? 429
      : 403;
  }
}

export type ResolvedPlan = {
  plan: PlanId;
  status: SubscriptionStatus;
  billingLive: boolean;
  currentPeriodEnd: Date | null;
};

export type PlanResolver = (userId?: string) => ResolvedPlan;

let billingLiveOverride: boolean | null = null;
let planResolver: PlanResolver | null = null;

export function isBillingLive(): boolean {
  return billingLiveOverride ?? BILLING_LIVE;
}

/** Test-only. Pass null to restore the hardcoded BILLING_LIVE constant. */
export function setBillingLiveForTests(value: boolean | null) {
  billingLiveOverride = value;
}

/** Test-only. Production always uses resolvePlanDefault unless HIREFLOW_PLAN_OVERRIDE is set locally. */
export function setPlanResolverForTests(resolver: PlanResolver | null) {
  planResolver = resolver;
}

export function resolvePlanDefault(_userId?: string): ResolvedPlan {
  const override = process.env.HIREFLOW_PLAN_OVERRIDE;
  if (override === "pro" && process.env.NODE_ENV !== "production") {
    return { plan: "pro", status: "none", billingLive: isBillingLive(), currentPeriodEnd: null };
  }
  return { plan: "free", status: "none", billingLive: isBillingLive(), currentPeriodEnd: null };
}

/** Never trust a client-submitted plan. Resolver is server-only. */
export function resolvePlan(userId?: string): ResolvedPlan {
  return (planResolver ?? resolvePlanDefault)(userId);
}

function effectivePlanFor(key: EntitlementKey, resolved: ResolvedPlan): PlanId {
  const def = entitlement(key);
  if (!resolved.billingLive && def.complimentaryWhileBillingOff && def.implementedNow) {
    return "pro";
  }
  return resolved.plan;
}

export async function assertEntitlement(
  userId: string,
  key: EntitlementKey,
  opts?: { used?: number; increment?: number },
): Promise<{ plan: PlanId; limit: LimitValue; remaining: number | "unlimited" | true; billedPlan: PlanId }> {
  const def = entitlement(key);
  const resolved = resolvePlan(userId);
  const billedPlan = resolved.plan;
  const plan = effectivePlanFor(key, resolved);
  const limit = limitFor(def, plan);

  if (!def.grantable) {
    throw new EntitlementError({ code: "NOT_GRANTABLE", key, plan: billedPlan, limit: false });
  }
  if (!def.implementedNow) {
    throw new EntitlementError({
      code: "NOT_IMPLEMENTED",
      key,
      plan: billedPlan,
      limit: limitFor(def, "free"),
    });
  }
  if (def.kind === "boolean") {
    if (limit !== true) {
      throw new EntitlementError({ code: "PLAN_REQUIRED", key, plan: billedPlan, limit });
    }
    return { plan, billedPlan, limit, remaining: true };
  }
  if (limit === "unlimited") {
    return { plan, billedPlan, limit, remaining: "unlimited" };
  }
  const used = opts?.used ?? 0;
  const next = used + (opts?.increment ?? 1);
  if (typeof limit === "number" && next > limit) {
    throw new EntitlementError({ code: "QUOTA_EXCEEDED", key, plan: billedPlan, limit, used });
  }
  return {
    plan,
    billedPlan,
    limit,
    remaining: typeof limit === "number" ? limit - next : true,
  };
}

export function publicCatalog() {
  const resolved = resolvePlan();
  return {
    billingLive: resolved.billingLive,
    plan: resolved.plan,
    status: resolved.status,
    plans: {
      free: {
        id: PLANS.free.id,
        displayName: PLANS.free.displayName,
        offerCopy: PLANS.free.offerCopy,
        priceInrExGst: PLANS.free.priceInrExGst,
      },
      pro: {
        id: PLANS.pro.id,
        displayName: PLANS.pro.displayName,
        offerCopy: PLANS.pro.offerCopy,
        priceInrExGst: PLANS.pro.priceInrExGst,
        gst: "applicable",
        indicativeTotalInrAt18PercentHypothesis: PLANS.pro.indicativeTotalInr,
        indicativeUsdHypothesis: PLANS.pro.indicativeUsdHypothesis,
        checkoutEnabled: false,
        note: "International USD is a hypothesis, not an approved offer.",
      },
    },
    entitlements: ENTITLEMENTS.filter((row) => row.grantable).map((row) => ({
      key: row.key,
      kind: row.kind,
      free: row.free,
      pro: row.pro,
      implementedNow: row.implementedNow,
      earliestPhase: row.earliestPhase,
      complimentaryWhileBillingOff: Boolean(row.complimentaryWhileBillingOff),
      notes: row.notes,
    })),
  };
}
