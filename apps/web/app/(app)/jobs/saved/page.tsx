import { listSavedJobs } from "@hireflow/jobs";
import { getDb } from "@hireflow/db";
import { EmptyState, TrustChip } from "@hireflow/ui";
import Link from "next/link";
import { requireUser } from "../../../../lib/session";
import { JobCard } from "../job-card";

export default async function SavedJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q : undefined;
  const db = await getDb();
  const rows = await listSavedJobs(db, user.id, { q });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Saved</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Saved listings stay on your account even if a source later expires. Expired labels are
          informational.
        </p>
      </div>
      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search saved jobs"
          className="w-full max-w-md rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
        />
        <button type="submit" className="text-sm text-[var(--color-accent)]">
          Search
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState
          title="No saved jobs"
          body="Save a listing from Discover to keep the title, employer, and apply link with your notes."
          action={
            <Link className="text-sm text-[var(--color-accent)]" href="/jobs">
              Discover jobs
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.saved.id} className="space-y-2">
              {row.job.status !== "open" ? <TrustChip tone="warn">No longer listed</TrustChip> : null}
              <p className="text-xs text-[var(--color-ink-soft)]">
                Saved {row.saved.savedAt.toISOString().slice(0, 10)}
                {row.saved.notes ? ` · ${row.saved.notes}` : ""}
              </p>
              <JobCard job={{ ...row.job, companyName: row.company.name, saved: true }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
