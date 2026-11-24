import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { HireFlowDb } from "./client";
import { aiUsage, usageEvent } from "./schema";

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

/** LLM assists this UTC month. Deterministic analysis must not write rows, so they are not counted. */
export async function countAiUsageThisMonth(db: HireFlowDb, userId: string) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const rows = await db.query.aiUsage.findMany({ where: eq(aiUsage.userId, userId) });
  return rows.filter((row) => row.createdAt >= start && row.provider !== "deterministic").length;
}

export async function countUsageEvents(db: HireFlowDb, userId: string) {
  const rows = await db.query.usageEvent.findMany({ where: eq(usageEvent.userId, userId) });
  return rows.length;
}
