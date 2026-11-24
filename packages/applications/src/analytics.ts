import { application, applicationEvent, type HireFlowDb } from "@hireflow/db";
import { assertEntitlement, isBillingLive } from "@hireflow/entitlements";
import { APPLICATION_STAGES } from "@hireflow/shared";
import { eq } from "drizzle-orm";

const MIN_N_FOR_MEDIAN = 5;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const even = sorted.length % 2 === 0;
  const value = even ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  return Math.round(value * 10) / 10;
}

function daysBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / 86_400_000;
}

export type PipelineAnalytics = {
  complimentaryPreview: boolean;
  total: number;
  byStage: Array<{ stage: (typeof APPLICATION_STAGES)[number]; count: number }>;
  medianDaysInStage: Array<{
    stage: string;
    n: number;
    medianDays: number | null;
    caveat: string | null;
  }>;
  notes: string[];
};

export async function getPipelineAnalytics(db: HireFlowDb, userId: string): Promise<PipelineAnalytics> {
  await assertEntitlement(userId, "applications.analytics");
  const rows = await db.select().from(application).where(eq(application.userId, userId));
  const events = await db.select().from(applicationEvent).where(eq(applicationEvent.userId, userId));
  const byStage = APPLICATION_STAGES.map((stage) => ({
    stage,
    count: rows.filter((row) => row.stage === stage).length,
  }));

  const durations = new Map<string, number[]>();
  const byApp = new Map<string, typeof events>();
  for (const event of events) {
    const list = byApp.get(event.applicationId) ?? [];
    list.push(event);
    byApp.set(event.applicationId, list);
  }
  const now = new Date();
  for (const row of rows) {
    const history = (byApp.get(row.id) ?? []).sort((a, b) => a.at.getTime() - b.at.getTime());
    if (history.length === 0) {
      const list = durations.get(row.stage) ?? [];
      list.push(daysBetween(row.createdAt, now));
      durations.set(row.stage, list);
      continue;
    }
    for (let i = 0; i < history.length; i++) {
      const current = history[i]!;
      const next = history[i + 1];
      const end = next?.at ?? now;
      const list = durations.get(current.toStage) ?? [];
      list.push(daysBetween(current.at, end));
      durations.set(current.toStage, list);
    }
  }

  const medianDaysInStage = APPLICATION_STAGES.map((stage) => {
    const values = durations.get(stage) ?? [];
    if (values.length < MIN_N_FOR_MEDIAN) {
      return {
        stage,
        n: values.length,
        medianDays: null,
        caveat: "too few rows",
      };
    }
    return {
      stage,
      n: values.length,
      medianDays: median(values),
      caveat: null,
    };
  });

  return {
    complimentaryPreview: !isBillingLive(),
    total: rows.length,
    byStage,
    medianDaysInStage,
    notes: [
      "Personal pipeline only. This is not a market conversion rate.",
      `Median days-in-stage is shown only when a stage has at least ${MIN_N_FOR_MEDIAN} observations.`,
    ],
  };
}
