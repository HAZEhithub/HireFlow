import { freshnessCopy } from "@hireflow/jobs";
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
  };
  match?: MatchExplanation;
}) {
  const freshness = freshnessCopy(job.freshnessLabel, job.listingKind);
  const location = job.locationText || [job.city, job.country].filter(Boolean).join(", ") || "Location not provided";
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
        <TrustChip tone={job.listingKind === "fixture" || job.status !== "open" ? "warn" : "neutral"}>
          {job.listingKind === "fixture"
            ? "Development sample"
            : job.listingKind === "user_import"
              ? "Imported by you"
              : `${job.source} board`}
        </TrustChip>
        <TrustChip tone={job.freshnessLabel === "stale" || job.freshnessLabel === "expired" ? "warn" : "good"}>
          {freshness.label}
        </TrustChip>
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
      </p>
    </article>
  );
}
