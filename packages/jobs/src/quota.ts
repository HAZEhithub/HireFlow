import { tryIncrementUsagePeriod, type HireFlowDb } from "@hireflow/db";
import { EntitlementError, assertEntitlement } from "@hireflow/entitlements";

export async function claimUrlImportQuota(db: HireFlowDb, userId: string) {
  const granted = await assertEntitlement(userId, "jobs.url_import_per_month", { used: 0, increment: 0 });
  if (typeof granted.limit !== "number") return granted;
  const bump = await tryIncrementUsagePeriod(db, userId, "jobs.url_import_per_month", granted.limit);
  if (!bump.ok) {
    throw new EntitlementError({
      code: "QUOTA_EXCEEDED",
      key: "jobs.url_import_per_month",
      plan: granted.billedPlan,
      limit: granted.limit,
      used: bump.count,
    });
  }
  return granted;
}
