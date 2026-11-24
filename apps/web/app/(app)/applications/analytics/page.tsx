import { getPipelineAnalytics } from "@hireflow/applications";
import { getDb } from "@hireflow/db";
import { APPLICATION_STAGE_LABELS } from "@hireflow/shared";
import { Card } from "@hireflow/ui";
import { requireUser } from "../../../../lib/session";
import { ComplimentaryNote } from "../../complimentary-note";

export default async function PipelineAnalyticsPage() {
  const user = await requireUser();
  const db = await getDb();
  const analytics = await getPipelineAnalytics(db, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Pipeline analytics</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Counts from your tracker only. This is not a market conversion statistic.
        </p>
        {analytics.complimentaryPreview ? <ComplimentaryNote /> : null}
      </div>
      <Card>
        <p className="font-display text-3xl">{analytics.total}</p>
        <p className="text-sm text-[var(--color-ink-soft)]">applications in your workspace</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">By stage</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {analytics.byStage.map((row) => (
              <li key={row.stage} className="flex justify-between gap-4">
                <span>{APPLICATION_STAGE_LABELS[row.stage]}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Median days in stage</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {analytics.medianDaysInStage.map((row) => (
              <li key={row.stage} className="flex justify-between gap-4">
                <span>{APPLICATION_STAGE_LABELS[row.stage as keyof typeof APPLICATION_STAGE_LABELS] ?? row.stage}</span>
                <span>
                  {row.medianDays == null
                    ? row.caveat
                    : `${row.medianDays} days (n=${row.n})`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <ul className="list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
        {analytics.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
