import { randomUUID } from "node:crypto";
import { employerBoard, job, jobSourceRun, type HireFlowDb } from "@hireflow/db";
import { and, desc, eq } from "drizzle-orm";
import { fetchProviderBoard } from "./adapters";
import { fixtureJobs } from "./fixtures";
import { nextMissingStatus } from "./freshness";
import { upsertCanonicalJobs } from "./persist";
import { EMPLOYER_REGISTRY } from "./registry";
import { stableId } from "./hash";
import type { FetchLike, JobAdapterId } from "./types";

export type IngestOptions = {
  fixtures?: boolean;
  fetch?: FetchLike;
  now?: Date;
  adapter?: Exclude<JobAdapterId, "user_import">;
  boardId?: string;
};

export type IngestReport = {
  runs: Array<{
    adapter: string;
    boardId: string;
    status: string;
    discovered: number;
    inserted: number;
    updated: number;
    ignored: number;
    errors: number;
    errorSummary?: string | null;
  }>;
  totals: { discovered: number; inserted: number; updated: number; ignored: number; errors: number };
};

async function recordRun(
  db: HireFlowDb,
  adapter: string,
  boardId: string,
  startedAt: Date,
  counts: { discovered: number; inserted: number; updated: number; ignored: number; errors: number },
  status: string,
  errorSummary?: string,
) {
  await db.insert(jobSourceRun).values({
    id: randomUUID(),
    adapter,
    boardId,
    startedAt,
    finishedAt: new Date(),
    jobsDiscovered: counts.discovered,
    jobsInserted: counts.inserted,
    jobsUpdated: counts.updated,
    jobsIgnored: counts.ignored,
    errorCount: counts.errors,
    status,
    errorSummary,
  });
}

async function markMissing(
  db: HireFlowDb,
  adapter: Exclude<JobAdapterId, "user_import">,
  boardId: string,
  seenExternalIds: string[],
) {
  const existing = await db.query.job.findMany({
    where: and(eq(job.source, adapter), eq(job.boardId, boardId), eq(job.listingKind, "live")),
  });
  for (const row of existing) {
    if (seenExternalIds.includes(row.externalId)) continue;
    const next = nextMissingStatus(row.missingConsecutive);
    await db
      .update(job)
      .set({
        missingConsecutive: next.missingConsecutive,
        status: next.status,
        freshnessLabel: next.status === "expired" ? "expired" : row.freshnessLabel,
      })
      .where(eq(job.id, row.id));
  }
}

export async function ingestJobs(db: HireFlowDb, opts: IngestOptions = {}): Promise<IngestReport> {
  const now = opts.now ?? new Date();
  const runs: IngestReport["runs"] = [];
  const totals = { discovered: 0, inserted: 0, updated: 0, ignored: 0, errors: 0 };

  if (opts.fixtures) {
    const startedAt = now;
    const jobs = fixtureJobs(now);
    const counts = await upsertCanonicalJobs(db, jobs, now);
    await recordRun(db, "fixture", "local", startedAt, { ...counts, errors: 0 }, "ok");
    runs.push({ adapter: "fixture", boardId: "local", status: "ok", ...counts, errors: 0 });
    totals.discovered += counts.discovered;
    totals.inserted += counts.inserted;
    totals.updated += counts.updated;
    totals.ignored += counts.ignored;
  }

  const dbBoards = await db.select().from(employerBoard);
  const registryBoards = EMPLOYER_REGISTRY.filter((board) => board.active).map((board) => ({
    adapter: board.adapter,
    boardIdentifier: board.boardId,
    employerDisplayName: board.displayName,
    active: board.active,
  }));

  for (const board of registryBoards) {
    const id = stableId(["board", board.adapter, board.boardIdentifier]);
    await db
      .insert(employerBoard)
      .values({
        id,
        adapter: board.adapter,
        boardIdentifier: board.boardIdentifier,
        employerDisplayName: board.employerDisplayName,
        active: board.active,
        supportedCountries: [],
      })
      .onConflictDoNothing();
  }

  const allBoards = [...dbBoards, ...(await db.select().from(employerBoard))].filter(
    (board, index, list) => list.findIndex((row) => row.id === board.id) === index,
  );

  const selected = allBoards.filter((board) => {
    if (!board.active) return false;
    if (opts.adapter && board.adapter !== opts.adapter) return false;
    if (opts.boardId && board.boardIdentifier !== opts.boardId) return false;
    return true;
  });

  for (const board of selected) {
    const startedAt = new Date();
    const adapter = board.adapter as Exclude<JobAdapterId, "user_import">;
    if (adapter !== "greenhouse" && adapter !== "lever" && adapter !== "ashby") continue;
    const result = await fetchProviderBoard(adapter, board.boardIdentifier, {
      fetch: opts.fetch,
      now,
      companyName: board.employerDisplayName,
    });
    if (!result.ok) {
      await recordRun(
        db,
        adapter,
        board.boardIdentifier,
        startedAt,
        { discovered: 0, inserted: 0, updated: 0, ignored: 0, errors: 1 },
        "error",
        result.error.slice(0, 500),
      );
      await db
        .update(employerBoard)
        .set({ lastIngestAt: new Date(), lastIngestStatus: "error" })
        .where(eq(employerBoard.id, board.id));
      await db
        .update(job)
        .set({ freshnessLabel: "source_error" })
        .where(and(eq(job.source, adapter), eq(job.boardId, board.boardIdentifier), eq(job.listingKind, "live")));
      runs.push({
        adapter,
        boardId: board.boardIdentifier,
        status: "error",
        discovered: 0,
        inserted: 0,
        updated: 0,
        ignored: 0,
        errors: 1,
        errorSummary: result.error,
      });
      totals.errors += 1;
      continue;
    }
    const counts = await upsertCanonicalJobs(db, result.jobs, now);
    await markMissing(
      db,
      adapter,
      board.boardIdentifier,
      result.jobs.map((row) => row.externalId),
    );
    await recordRun(db, adapter, board.boardIdentifier, startedAt, { ...counts, errors: 0 }, "ok");
    await db
      .update(employerBoard)
      .set({ lastIngestAt: new Date(), lastIngestStatus: "ok" })
      .where(eq(employerBoard.id, board.id));
    runs.push({ adapter, boardId: board.boardIdentifier, status: "ok", ...counts, errors: 0 });
    totals.discovered += counts.discovered;
    totals.inserted += counts.inserted;
    totals.updated += counts.updated;
    totals.ignored += counts.ignored;
  }

  return { runs, totals };
}

export async function listIngestRuns(db: HireFlowDb, limit = 50) {
  return db.select().from(jobSourceRun).orderBy(desc(jobSourceRun.startedAt)).limit(limit);
}

export async function addEmployerBoard(
  db: HireFlowDb,
  input: {
    adapter: Exclude<JobAdapterId, "user_import">;
    boardIdentifier: string;
    employerDisplayName: string;
    employerWebsite?: string;
    careerPageUrl?: string;
    supportedCountries?: string[];
    sourceDocumentationUrl?: string;
    termsNotes?: string;
  },
) {
  const id = stableId(["board", input.adapter, input.boardIdentifier]);
  await db
    .insert(employerBoard)
    .values({
      id,
      adapter: input.adapter,
      boardIdentifier: input.boardIdentifier.trim(),
      employerDisplayName: input.employerDisplayName.trim(),
      employerWebsite: input.employerWebsite,
      careerPageUrl: input.careerPageUrl,
      supportedCountries: input.supportedCountries ?? [],
      active: true,
      sourceDocumentationUrl: input.sourceDocumentationUrl,
      termsNotes: input.termsNotes,
      lastReviewed: new Date(),
    })
    .onConflictDoUpdate({
      target: [employerBoard.adapter, employerBoard.boardIdentifier],
      set: {
        employerDisplayName: input.employerDisplayName.trim(),
        employerWebsite: input.employerWebsite,
        careerPageUrl: input.careerPageUrl,
        supportedCountries: input.supportedCountries ?? [],
        sourceDocumentationUrl: input.sourceDocumentationUrl,
        termsNotes: input.termsNotes,
        lastReviewed: new Date(),
      },
    });
  return id;
}

export async function setEmployerBoardActive(db: HireFlowDb, id: string, active: boolean) {
  await db.update(employerBoard).set({ active }).where(eq(employerBoard.id, id));
}
