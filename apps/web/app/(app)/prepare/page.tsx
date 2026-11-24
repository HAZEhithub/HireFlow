import { listApplications } from "@hireflow/applications";
import { getDb } from "@hireflow/db";
import { getCompanyBriefForUser, listSavedJobs } from "@hireflow/jobs";
import { Button, Card, EmptyState } from "@hireflow/ui";
import Link from "next/link";
import { requireUser } from "../../../lib/session";
import { ComplimentaryNote } from "../complimentary-note";

export default async function PreparePage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const user = await requireUser();
  const { jobId } = await searchParams;
  const db = await getDb();
  const saved = await listSavedJobs(db, user.id);
  const tracked = await listApplications(db, user.id);
  const options = [
    ...saved.map((row) => ({
      id: row.job.id,
      label: `${row.job.title} · ${row.company.name}`,
    })),
    ...tracked
      .filter((row) => row.jobId)
      .map((row) => ({
        id: row.jobId as string,
        label: `${row.title} · ${row.companyName}`,
      })),
  ].filter((row, index, all) => all.findIndex((item) => item.id === row.id) === index);

  const brief = jobId ? await getCompanyBriefForUser(db, user.id, jobId).catch(() => null) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Prepare</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Company briefs use sourced job fields only. Application packs stay on each application.
          Interview practice is not implemented.
        </p>
      </div>
      {options.length === 0 ? (
        <EmptyState
          title="Save or track a job first"
          body="Briefs are assembled from a listing HireFlow already stored. There is no live interview copilot."
          action={
            <Link href="/jobs" className="text-sm text-[var(--color-accent)]">
              Open Discover
            </Link>
          }
        />
      ) : (
        <Card>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <label className="text-sm">
              Job
              <select
                name="jobId"
                defaultValue={jobId ?? options[0]?.id}
                className="mt-1 block min-h-10 min-w-64 rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
              >
                {options.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="secondary">
              Show brief
            </Button>
          </form>
        </Card>
      )}
      {brief ? (
        <Card>
          {brief.complimentaryPreview ? <ComplimentaryNote /> : null}
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            {brief.job.companyName}
          </p>
          <h2 className="font-display mt-1 text-2xl">{brief.job.title}</h2>
          <ul className="mt-4 space-y-1 text-sm text-[var(--color-ink-soft)]">
            <li>Location: {brief.job.location}</li>
            <li>Workplace: {brief.job.workplaceType}</li>
            <li>Employment: {brief.job.employmentType}</li>
            <li>Disclosed salary: {brief.job.salary}</li>
            <li>Source: {brief.job.source}</li>
            <li>Last retrieved: {brief.job.lastRetrieved}</li>
            <li>Apply URL: {brief.job.applyUrl}</li>
          </ul>
          <ul className="mt-4 list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
            {brief.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <Link className="text-[var(--color-accent)]" href={`/applications/new?jobId=${brief.job.id}`}>
              Assemble an application pack
            </Link>
          </p>
        </Card>
      ) : jobId ? (
        <EmptyState title="Brief not available" body="That listing is not visible in your workspace." />
      ) : null}
    </div>
  );
}
