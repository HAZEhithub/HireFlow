import { getDb, profile } from "@hireflow/db";
import { searchJobs } from "@hireflow/jobs";
import { matchJobToProfile } from "@hireflow/matching";
import { EmptyState } from "@hireflow/ui";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { requireUser } from "../../../../lib/session";
import { JobCard } from "../job-card";

export default async function RecommendedJobsPage() {
  const user = await requireUser();
  const db = await getDb();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  const result = await searchJobs(db, user.id, { page: 1, pageSize: 200, sort: "recently_verified" });
  const ranked = result.results
    .map((row) => ({ row, match: matchJobToProfile(row, p ?? null) }))
    .sort((a, b) => (b.match.overall ?? -1) - (a.match.overall ?? -1));
  const incomplete = !p || ((p.skills?.length ?? 0) === 0 && (p.desiredTitles?.length ?? 0) === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Recommended</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Ranked with deterministic overlap of your profile and listing fields. Semantic matching is
          not used. Scores are not hire probabilities.
        </p>
      </div>
      {incomplete ? (
        <EmptyState
          title="Recommendations need a fuller profile"
          body="Add desired titles and skills so overlap can be scored. Listings below are unsorted until then."
          action={
            <Link className="text-sm text-[var(--color-accent)]" href="/onboarding">
              Continue onboarding
            </Link>
          }
        />
      ) : null}
      {ranked.length === 0 ? (
        <EmptyState
          title="No jobs to recommend yet"
          body="Add a permitted employer board or import a URL. Retrieval from a public board API is not independent employer verification. HireFlow will not invent openings."
        />
      ) : (
        <div className="space-y-4">
          {ranked.slice(0, 20).map(({ row, match }) => (
            <JobCard key={row.id} job={row} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
