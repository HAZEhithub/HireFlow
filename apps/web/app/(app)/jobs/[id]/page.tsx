import { getEvidenceMapForUser, listResumeVersionOptions } from "@hireflow/applications";
import { getDb, jobVerificationSignal, profile } from "@hireflow/db";
import { freshnessCopy, getJobForUser, isSafeApplyHref, jobTrustChips } from "@hireflow/jobs";
import { matchJobToProfile } from "@hireflow/matching";
import { Button, Card, EmptyState, TrustChip } from "@hireflow/ui";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../lib/session";
import { saveJobAction } from "../actions";
import { SaveControls } from "../save-controls";
import { EvidenceMapPanel } from "./evidence-map-panel";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resumeVersionId?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { resumeVersionId } = await searchParams;
  const db = await getDb();
  const row = await getJobForUser(db, user.id, id);
  if (!row) notFound();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  const match = matchJobToProfile(row, p ?? null);
  const freshness = freshnessCopy(row.freshnessLabel, row.listingKind);
  const signals = await db
    .select()
    .from(jobVerificationSignal)
    .where(eq(jobVerificationSignal.jobId, row.id));
  const location = row.locationText || [row.city, row.country].filter(Boolean).join(", ") || "Not provided";
  const versions = await listResumeVersionOptions(db, user.id);
  const map = await getEvidenceMapForUser(db, user.id, row.id, resumeVersionId).catch(() => null);

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/jobs" className="text-[var(--color-accent)]">
          Back to Discover
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">{row.companyName}</p>
          <h1 className="font-display mt-1 text-4xl">{row.title}</h1>
          <p className="mt-2 text-[var(--color-ink-soft)]">
            {location} · {row.workplaceType} · {row.employmentType || "employment not provided"}
            {row.department ? ` · ${row.department}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SaveControls jobId={row.id} saved={row.saved} />
          <Link href={`/applications/new?jobId=${row.id}`}>
            <Button type="button" variant="secondary">
              Track application
            </Button>
          </Link>
          <Link href={`/resumes/for-job/${row.id}`}>
            <Button type="button" variant="secondary">
              Compare resume
            </Button>
          </Link>
          <Link href={`/resumes/for-job/${row.id}?intent=tailor`}>
            <Button type="button" variant="secondary">
              Tailor resume
            </Button>
          </Link>
          <Link href={`/prepare?jobId=${row.id}`}>
            <Button type="button" variant="secondary">
              Company brief
            </Button>
          </Link>
          {isSafeApplyHref(row.applyUrl) ? (
            <a href={row.applyUrl} target="_blank" rel="noreferrer">
              <Button type="button">Apply on employer site</Button>
            </a>
          ) : (
            <p className="text-sm text-[var(--color-ink-soft)]">Application URL is not a public http(s) link.</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {jobTrustChips(row, freshness.label).map((chip) => (
          <TrustChip key={`${chip.label}-${chip.tone}`} tone={chip.tone}>
            {chip.label}
          </TrustChip>
        ))}
      </div>
      <Card>
        <h2 className="font-display text-xl">Source and freshness</h2>
        <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-soft)]">
          <li>Source: {row.source}</li>
          <li>Application URL: {row.applyUrl}</li>
          <li>First discovered: {row.firstSeen.toISOString()}</li>
          <li>Last retrieved: {row.lastVerified.toISOString()}</li>
          <li>
            Employer publication date: {row.publishedAt ? row.publishedAt.toISOString() : "not provided"}
          </li>
          <li>
            Employer last updated:{" "}
            {row.lastProviderUpdate ? row.lastProviderUpdate.toISOString() : "not provided"}
          </li>
          <li>{freshness.detail}</li>
          <li>Apply URL status: {row.applyUrlStatus}</li>
          <li>Retrieval is not independent employer verification.</li>
        </ul>
        {signals.length ? (
          <ul className="mt-3 space-y-1 text-sm">
            {signals.map((signal) => (
              <li key={signal.id}>
                <TrustChip tone="warn">{signal.message}</TrustChip>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
      <Card>
        <h2 className="font-display text-xl">Compatibility</h2>
        {match.needsMoreProfile ? (
          <EmptyState
            title="Compatibility needs more profile data"
            body="Add desired titles and skills before HireFlow can score overlap. This is not a hire probability."
            action={
              <Link className="text-sm text-[var(--color-accent)]" href="/profile">
                Complete profile
              </Link>
            }
          />
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-medium">Overlap score {match.overall} / 100</p>
            <p className="text-[var(--color-ink-soft)]">{match.disclaimer}</p>
            <ul className="list-disc pl-5 text-[var(--color-ink-soft)]">
              {match.explanation.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p>Skills overlap: {match.matchingSkills.join(", ") || "none listed"}</p>
            <p>Missing from profile: {match.missingRequiredSkills.join(", ") || "none compared"}</p>
            <p>
              Location {match.location} · Workplace {match.workplace} · Employment {match.employment}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Weights: skills {match.weights.skills * 100}%, title {match.weights.title * 100}%, location{" "}
              {match.weights.location * 100}%, workplace {match.weights.workplace * 100}%, employment{" "}
              {match.weights.employment * 100}%.
            </p>
          </div>
        )}
      </Card>
      <Card>
        <h2 className="font-display text-xl">Description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink)]">
          {row.descriptionText || "No description was supplied by the source."}
        </p>
        <div className="mt-4 text-sm text-[var(--color-ink-soft)]">
          <p>Required skills: {(row.requiredSkills ?? []).join(", ") || "not extracted"}</p>
          <p>Preferred skills: {(row.preferredSkills ?? []).join(", ") || "not extracted"}</p>
          <p>
            Salary:{" "}
            {row.salaryDisclosure === "disclosed"
              ? `${row.salaryMin ?? "?"}–${row.salaryMax ?? "?"} ${row.salaryCurrency ?? ""}`
              : "not provided by the source"}
          </p>
        </div>
      </Card>
      <Card>
        {map ? (
          <EvidenceMapPanel
            jobId={row.id}
            complimentaryPreview={map.complimentaryPreview}
            disclaimer={map.disclaimer}
            overall={map.overall}
            methodology={map.methodology}
            items={map.items}
            needsResume={map.needsResume}
            resumeVersionId={map.resumeVersionId}
            versions={versions.map((item) => ({
              id: item.id,
              title: item.title,
              versionNumber: item.versionNumber,
            }))}
          />
        ) : (
          <p className="text-sm text-[var(--color-ink-soft)]">
            The evidence map could not be loaded. Apply, tracking, and the listing details above still use this job
            record.
          </p>
        )}
      </Card>
      {row.saved ? (
        <Card>
          <h2 className="font-display text-xl">Your notes</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{row.savedNotes || "No notes yet."}</p>
          <form action={saveJobAction} className="mt-3 space-y-2">
            <input type="hidden" name="jobId" value={row.id} />
            <textarea
              name="notes"
              defaultValue={row.savedNotes ?? ""}
              className="min-h-24 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
            />
            <Button type="submit" variant="secondary">
              Save notes
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
