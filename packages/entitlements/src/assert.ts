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

/** Phase 1: ignore any future subscription row. Everyone is Free. */
export function resolvePlan(_userId?: string): ResolvedPlan {
  return { plan: "free", status: "none", billingLive: BILLING_LIVE, currentPeriodEnd: null };
}

export async function assertEntitlement(
  userId: string,
  key: EntitlementKey,
  opts?: { used?: number; increment?: number },
): Promise<{ plan: PlanId; limit: LimitValue; remaining: number | "unlimited" | true }> {
  const def = entitlement(key);
  const resolved = resolvePlan(userId);
  const limit = limitFor(def, resolved.plan);

  if (!def.grantable) {
    throw new EntitlementError({ code: "NOT_GRANTABLE", key, plan: resolved.plan, limit: false });
  }
  if (!def.implementedNow) {
    throw new EntitlementError({
      code: "NOT_IMPLEMENTED",
      key,
      plan: resolved.plan,
      limit: limitFor(def, "free"),
    });
  }
  if (def.kind === "boolean") {
    if (limit !== true) {
      throw new EntitlementError({ code: "PLAN_REQUIRED", key, plan: resolved.plan, limit });
    }
    return { plan: resolved.plan, limit, remaining: true };
  }
  if (limit === "unlimited") {
    return { plan: resolved.plan, limit, remaining: "unlimited" };
  }
  const used = opts?.used ?? 0;
  const next = used + (opts?.increment ?? 1);
  if (typeof limit === "number" && next > limit) {
    throw new EntitlementError({ code: "QUOTA_EXCEEDED", key, plan: resolved.plan, limit, used });
  }
  return {
    plan: resolved.plan,
    limit,
    remaining: typeof limit === "number" ? limit - next : true,
  };
}

export function publicCatalog() {
  return {
    billingLive: BILLING_LIVE,
    plan: resolvePlan().plan,
    status: resolvePlan().status,
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
        checkoutEnabled: false,
      },
    },
    entitlements: ENTITLEMENTS.filter((row) => row.grantable).map((row) => ({
      key: row.key,
      kind: row.kind,
      free: row.free,
      pro: row.pro,
      implementedNow: row.implementedNow,
      earliestPhase: row.earliestPhase,
      notes: row.notes,
    })),
  };
}
