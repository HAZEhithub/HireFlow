import { getDb } from "@hireflow/db";
import { analyzeResumeForUser, getResume } from "@hireflow/resumes";
import { Card, TrustChip } from "@hireflow/ui";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../lib/session";

export default async function ResumeAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  try {
    await getResume(db, user.id, id);
  } catch {
    notFound();
  }
  const analysis = await analyzeResumeForUser(db, user.id, id);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Analysis</p>
        <h1 className="font-display mt-1 text-4xl">Evidence-based review</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">{analysis.scoreDefinition}</p>
      </div>
      <Card>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Completeness</p>
        <p className="font-display mt-2 text-4xl">{analysis.completeness} / 100</p>
        <TrustChip>Not an ATS score</TrustChip>
      </Card>
      <div className="space-y-3">
        {analysis.findings.map((finding) => (
          <Card key={finding.id}>
            <div className="flex flex-wrap items-center gap-2">
              <TrustChip tone={finding.severity === "missing" ? "warn" : "neutral"}>{finding.area}</TrustChip>
              <h2 className="font-display text-xl">{finding.title}</h2>
            </div>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{finding.detail}</p>
            {finding.exampleBefore ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                <p>
                  <span className="font-medium">Current:</span> {finding.exampleBefore}
                </p>
                <p>
                  <span className="font-medium">Clearer phrasing:</span> {finding.exampleAfter}
                  {finding.requiresUserFact ? " (confirm this is true before using it)" : ""}
                </p>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
      <ul className="list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
        {analysis.limitations.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
