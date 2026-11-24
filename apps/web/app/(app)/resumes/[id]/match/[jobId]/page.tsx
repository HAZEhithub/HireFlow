import { getDb } from "@hireflow/db";
import { getResume, matchResumeJob } from "@hireflow/resumes";
import { Button, Card, TrustChip } from "@hireflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../../lib/session";
import { startTailorAction } from "../../../actions";

export default async function ResumeMatchPage({
  params,
}: {
  params: Promise<{ id: string; jobId: string }>;
}) {
  const user = await requireUser();
  const { id, jobId } = await params;
  const db = await getDb();
  try {
    await getResume(db, user.id, id);
  } catch {
    notFound();
  }
  let result;
  try {
    result = await matchResumeJob(db, user.id, id, jobId);
  } catch {
    notFound();
  }
  const match = result.match;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Compatibility</p>
        <h1 className="font-display mt-1 text-4xl">{result.job.title}</h1>
        <p className="mt-1 text-[var(--color-ink-soft)]">{result.job.companyName}</p>
      </div>
      <Card>
        <p className="font-display text-3xl">{match.overall ?? "—"} / 100</p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{match.disclaimer}</p>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{match.methodology}</p>
      </Card>
      <div className="space-y-3">
        {match.evidence.map((row) => (
          <Card key={`${row.kind}-${row.requirement}`}>
            <div className="flex flex-wrap items-center gap-2">
              <TrustChip
                tone={row.status === "strong" ? "good" : row.status === "missing" ? "warn" : "neutral"}
              >
                {row.status}
              </TrustChip>
              <h2 className="font-medium">{row.requirement}</h2>
              <span className="text-xs text-[var(--color-ink-soft)]">{row.kind.replace("_", " ")}</span>
            </div>
            <p className="mt-2 text-sm">{row.note}</p>
            {row.evidence.length ? (
              <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
                {row.evidence.map((item) => (
                  <li key={`${item.section}-${item.text}`}>
                    {item.section}: {item.text}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}
      </div>
      {match.suggestedImprovements.length ? (
        <Card>
          <h2 className="font-display text-xl">Suggested improvements</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
            {match.suggestedImprovements.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card>
        <h2 className="font-display text-xl">Application pack</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {result.pack.slots.map((slot) => (
            <li key={slot.id}>
              {slot.label} — {slot.status === "available" ? "available" : "coming soon"}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{result.pack.note}</p>
        <form action={startTailorAction} className="mt-4">
          <input type="hidden" name="resumeId" value={id} />
          <input type="hidden" name="jobId" value={jobId} />
          <Button type="submit">Tailor resume for this job</Button>
        </form>
        <Link className="mt-3 inline-block text-sm text-[var(--color-accent)]" href={`/jobs/${jobId}`}>
          Back to job
        </Link>
      </Card>
    </div>
  );
}
