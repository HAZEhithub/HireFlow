import { randomUUID } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import type { HireFlowDb } from "./client";
import { aiUsage, usageEvent, usagePeriod } from "./schema";

export function utcMonthStart(at = new Date()) {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1, 0, 0, 0, 0));
}

export async function recordUsageEvent(
  db: HireFlowDb,
  input: { userId?: string | null; kind: "auth" | "api" | "ai"; name: string },
) {
  await db.insert(usageEvent).values({
    id: randomUUID(),
    userId: input.userId ?? null,
    kind: input.kind,
    name: input.name,
  });
}

export async function recordAiUsage(
  db: HireFlowDb,
  input: {
    userId?: string | null;
    feature: string;
    provider: string;
    model?: string | null;
    status: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    estimatedUsd?: string | number | null;
  },
) {
  await db.insert(aiUsage).values({
    id: randomUUID(),
    userId: input.userId ?? null,
    feature: input.feature,
    provider: input.provider,
    model: input.model ?? null,
    inputTokens: input.inputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
    estimatedUsd: input.estimatedUsd == null ? null : String(input.estimatedUsd),
    status: input.status,
  });
}

export async function countAiUsage(db: HireFlowDb, userId: string) {
  const rows = await db.query.aiUsage.findMany({ where: eq(aiUsage.userId, userId) });
  return rows.length;
}

/** Successful non-deterministic LLM assists this UTC month. */
export async function countAiUsageThisMonth(db: HireFlowDb, userId: string) {
  const start = utcMonthStart();
  const rows = await db.query.aiUsage.findMany({ where: eq(aiUsage.userId, userId) });
  return rows.filter(
    (row) =>
      row.createdAt >= start &&
      row.provider !== "deterministic" &&
      row.status === "success",
  ).length;
}

export async function countUsageEvents(db: HireFlowDb, userId: string) {
  const rows = await db.query.usageEvent.findMany({ where: eq(usageEvent.userId, userId) });
  return rows.length;
}

export async function getUsagePeriodCount(
  db: HireFlowDb,
  userId: string,
  key: string,
  at = new Date(),
) {
  const periodStart = utcMonthStart(at);
  const row = await db.query.usagePeriod.findFirst({
    where: and(
      eq(usagePeriod.userId, userId),
      eq(usagePeriod.key, key),
      eq(usagePeriod.periodStart, periodStart),
    ),
  });
  return row?.count ?? 0;
}

/**
 * Compare-and-set monthly counter. Returns ok:false when count would exceed limit.
 * Callers must treat this as the quota source of truth for monthly keys.
 */
export async function tryIncrementUsagePeriod(
  db: HireFlowDb,
  userId: string,
  key: string,
  limit: number,
  at = new Date(),
): Promise<{ ok: true; count: number } | { ok: false; count: number }> {
  const periodStart = utcMonthStart(at);
  const id = `${userId}:${key}:${periodStart.toISOString()}`;
  await db
    .insert(usagePeriod)
    .values({ id, userId, key, periodStart, count: 0 })
    .onConflictDoNothing({
      target: [usagePeriod.userId, usagePeriod.key, usagePeriod.periodStart],
    });
  const updated = await db
    .update(usagePeriod)
    .set({ count: sql`${usagePeriod.count} + 1` })
    .where(
      and(
        eq(usagePeriod.userId, userId),
        eq(usagePeriod.key, key),
        eq(usagePeriod.periodStart, periodStart),
        lt(usagePeriod.count, limit),
      ),
    )
    .returning({ count: usagePeriod.count });
  const count = updated[0]?.count;
  if (typeof count === "number") return { ok: true, count };
  return { ok: false, count: await getUsagePeriodCount(db, userId, key, at) };
}

export async function decrementUsagePeriod(
  db: HireFlowDb,
  userId: string,
  key: string,
  at = new Date(),
) {
  const periodStart = utcMonthStart(at);
  await db
    .update(usagePeriod)
    .set({ count: sql`GREATEST(${usagePeriod.count} - 1, 0)` })
    .where(
      and(
        eq(usagePeriod.userId, userId),
        eq(usagePeriod.key, key),
        eq(usagePeriod.periodStart, periodStart),
      ),
    );
}
