import { ComplimentaryNote } from "../../complimentary-note";
import { Card, EmptyState, TrustChip } from "@hireflow/ui";
import Link from "next/link";
import type { EvidenceMapItem } from "@hireflow/matching";

function tone(status: string) {
  if (status === "strong") return "good" as const;
  if (status === "missing") return "warn" as const;
  return "neutral" as const;
}

export function EvidenceMapPanel({
  jobId,
  complimentaryPreview,
  disclaimer,
  overall,
  methodology,
  items,
  needsResume,
  resumeVersionId,
  versions,
}: {
  jobId: string;
  complimentaryPreview: boolean;
  disclaimer: string;
  overall: number | null;
  methodology: string | null;
  items: EvidenceMapItem[];
  needsResume: boolean;
  resumeVersionId: string | null;
  versions: Array<{ id: string; title: string; versionNumber: number }>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Job Fit Evidence Map</h2>
          {complimentaryPreview ? <ComplimentaryNote /> : null}
        </div>
        <Link className="text-sm text-[var(--color-accent)]" href={`/jobs/${jobId}/evidence-map`}>
          Open focused view
        </Link>
      </div>
      {versions.length > 1 ? (
        <form className="flex flex-wrap items-end gap-2" method="get">
          <label className="text-sm">
            Resume version
            <select
              name="resumeVersionId"
              defaultValue={resumeVersionId ?? ""}
              className="ml-2 min-h-10 rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
            >
              {versions.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.title} · v{row.versionNumber}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="text-sm text-[var(--color-accent)]">
            Compare this version
          </button>
        </form>
      ) : null}
      {needsResume ? (
        <EmptyState
          title="Add a resume to map evidence"
          body="The map quotes your resume and vault notes. It does not invent experience."
          action={
            <Link className="text-sm text-[var(--color-accent)]" href="/resumes">
              Open Resume Studio
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm">
            Overlap {overall ?? "—"} / 100. {disclaimer}
          </p>
          {methodology ? <p className="text-xs text-[var(--color-ink-soft)]">{methodology}</p> : null}
          <div className="space-y-3">
            {items.map((row) => (
              <Card key={`${row.kind}-${row.requirement}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <TrustChip tone={tone(row.status)}>{row.status}</TrustChip>
                  <h3 className="font-medium">{row.requirement}</h3>
                </div>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{row.note}</p>
                {row.evidence.length ? (
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {row.evidence.map((hit) => (
                      <li key={`${hit.section}-${hit.text}`}>
                        <span className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
                          {hit.section}
                        </span>
                        : {hit.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {row.vaultQuotes.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {row.vaultQuotes.map((quote) => (
                      <li key={quote.id}>
                        Vault · {quote.title} ({quote.quotedAs}): {quote.excerpt}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
