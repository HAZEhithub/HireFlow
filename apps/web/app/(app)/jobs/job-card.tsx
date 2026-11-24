import { freshnessCopy, jobTrustChips } from "@hireflow/jobs";
import { TrustChip } from "@hireflow/ui";
import type { MatchExplanation } from "@hireflow/matching";
import Link from "next/link";
import { SaveControls } from "./save-controls";

export function JobCard({
  job,
  match,
}: {
  job: {
    id: string;
    title: string;
    companyName: string;
    locationText: string | null;
    city: string | null;
    country: string | null;
    workplaceType: string;
    employmentType: string;
    source: string;
    listingKind: string;
    freshnessLabel: string;
    lastVerified: Date;
    publishedAt: Date | null;
    lastProviderUpdate?: Date | null;
    status: string;
    saved: boolean;
    applyUrlStatus?: string | null;
    injectionFlagged?: boolean | null;
    signals?: Array<{ kind: string; message: string }>;
  };
  match?: MatchExplanation;
}) {
  const freshness = freshnessCopy(job.freshnessLabel, job.listingKind);
  const location = job.locationText || [job.city, job.country].filter(Boolean).join(", ") || "Location not provided";
  const chips = jobTrustChips(job, freshness.label);
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">{job.companyName}</p>
          <h2 className="font-display mt-1 text-2xl">
            <Link className="hover:text-[var(--color-accent)]" href={`/jobs/${job.id}`}>
              {job.title}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {location} · {job.workplaceType} · {job.employmentType || "employment not provided"}
          </p>
        </div>
        <SaveControls jobId={job.id} saved={job.saved} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <TrustChip key={`${chip.label}-${chip.tone}`} tone={chip.tone}>
            {chip.label}
          </TrustChip>
        ))}
        {match?.needsMoreProfile ? (
          <TrustChip>Compatibility needs profile</TrustChip>
        ) : match?.overall != null ? (
          <TrustChip tone="good">Compatibility {match.overall}</TrustChip>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-[var(--color-ink-soft)]">{freshness.detail}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
        Last retrieved {job.lastVerified.toISOString().slice(0, 10)}
        {job.publishedAt
          ? ` · Employer published ${job.publishedAt.toISOString().slice(0, 10)}`
          : job.lastProviderUpdate
            ? ` · Employer last updated ${job.lastProviderUpdate.toISOString().slice(0, 10)}`
            : " · Publication date not provided"}
        {" · Retrieval is not independent employer verification."}
      </p>
    </article>
  );
}
