import { listApplications } from "@hireflow/applications";
import { getDb } from "@hireflow/db";
import { APPLICATION_STAGE_LABELS, APPLICATION_STAGES } from "@hireflow/shared";
import { Button, EmptyState, TrustChip } from "@hireflow/ui";
import Link from "next/link";
import { requireUser } from "../../../lib/session";
import { ApplicationTable } from "./application-table";
import { KanbanBoard } from "./kanban";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const view = typeof raw.view === "string" ? raw.view : "table";
  const db = await getDb();
  const rows = await listApplications(db, user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Workspace</p>
          <h1 className="font-display mt-1 text-4xl">Applications</h1>
          <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
            Unlimited on Free. You always submit on the employer site. HireFlow never auto-applies.
            The table is the keyboard and screen-reader path; the board is a visual extra.
          </p>
        </div>
        <Link href="/applications/new">
          <Button type="button">Add application</Button>
        </Link>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Workspace view">
        <TrustChip tone={view !== "board" ? "good" : "neutral"}>
          <Link href="/applications?view=table" className="min-h-6 inline-flex items-center">
            Table
          </Link>
        </TrustChip>
        <TrustChip tone={view === "board" ? "good" : "neutral"}>
          <Link href="/applications?view=board" className="min-h-6 inline-flex items-center">
            Board
          </Link>
        </TrustChip>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="Track a saved or imported job, or add a company and title yourself. Stages: Saved, Preparing, Applied, Interview, Offer, Rejected, Withdrawn."
          action={
            <div className="flex flex-wrap gap-4">
              <Link className="text-sm text-[var(--color-accent)]" href="/jobs/saved">
                From saved jobs
              </Link>
              <Link className="text-sm text-[var(--color-accent)]" href="/applications/new">
                Add manually
              </Link>
            </div>
          }
        />
      ) : view === "board" ? (
        <KanbanBoard
          stages={[...APPLICATION_STAGES]}
          labels={APPLICATION_STAGE_LABELS}
          rows={rows.map((row) => ({
            id: row.id,
            title: row.title,
            companyName: row.companyName,
            stage: row.stage,
          }))}
        />
      ) : (
        <ApplicationTable rows={rows} />
      )}
    </div>
  );
}
