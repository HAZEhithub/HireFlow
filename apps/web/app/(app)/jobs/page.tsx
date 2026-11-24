import { getDb, profile } from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import { parseJobSearch, searchJobs } from "@hireflow/jobs";
import { matchJobToProfile } from "@hireflow/matching";
import { EmptyState } from "@hireflow/ui";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { requireUser } from "../../../lib/session";
import { FiltersForm } from "./filters-form";
import { JobCard } from "./job-card";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  await assertEntitlement(user.id, "jobs.discover");
  const raw = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const query = parseJobSearch(flat);
  const db = await getDb();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  const result = await searchJobs(db, user.id, query);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(flat)) {
    if (value && key !== "page") params.set(key, value);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Jobs</p>
        <h1 className="font-display mt-1 text-4xl">Discover</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Search listings retrieved from permitted employer boards or imported by you. Compatibility
          is an overlap of your profile fields — not a hire probability.
        </p>
      </div>
      <FiltersForm
        values={flat}
        availability={p?.availability}
        openToInternships={p?.openToInternships}
      />
      <p className="text-sm text-[var(--color-ink-soft)]">
        {result.total} result{result.total === 1 ? "" : "s"}
      </p>
      {result.results.length === 0 ? (
        <EmptyState
          title="No jobs match these filters"
          body="The production employer registry is empty until verified board identifiers are added. For local development, run the fixture ingest CLI. You can also import a job URL."
          action={
            <Link className="text-sm text-[var(--color-accent)]" href="/jobs/import">
              Import a job
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {result.results.map((row) => (
            <JobCard key={row.id} job={row} match={matchJobToProfile(row, p ?? null)} />
          ))}
        </div>
      )}
      {result.total > result.pageSize ? (
        <nav className="flex gap-3 text-sm" aria-label="Pagination">
          {result.page > 1 ? (
            <Link href={`/jobs?${params.toString()}&page=${result.page - 1}`}>Previous</Link>
          ) : null}
          {result.page * result.pageSize < result.total ? (
            <Link href={`/jobs?${params.toString()}&page=${result.page + 1}`}>Next</Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
