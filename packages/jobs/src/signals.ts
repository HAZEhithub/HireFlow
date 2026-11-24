import { jobVerificationSignal, type HireFlowDb } from "@hireflow/db";
import { inArray } from "drizzle-orm";

export async function listVerificationSignals(db: HireFlowDb, jobIds: string[]) {
  if (jobIds.length === 0) return [];
  return db
    .select()
    .from(jobVerificationSignal)
    .where(inArray(jobVerificationSignal.jobId, jobIds));
}
