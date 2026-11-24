import { listResumeVersionOptions } from "@hireflow/applications";
import { getDb } from "@hireflow/db";
import { getJobForUser, listSavedJobs } from "@hireflow/jobs";
import { APPLICATION_STAGE_LABELS, APPLICATION_STAGES } from "@hireflow/shared";
import { Button, Field, Input, Textarea } from "@hireflow/ui";
import { requireUser } from "../../../../lib/session";
import { createApplicationAction } from "../actions";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const jobId = typeof raw.jobId === "string" ? raw.jobId : "";
  const error = typeof raw.error === "string" ? raw.error : undefined;
  const db = await getDb();
  const job = jobId ? await getJobForUser(db, user.id, jobId) : null;
  const saved = await listSavedJobs(db, user.id);
  const versions = await listResumeVersionOptions(db, user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl">Track an application</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          HireFlow records the search. You submit on the employer site. Apply links open in a new tab
          and are never posted by HireFlow.
        </p>
      </div>
      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--color-warn)] px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <form action={createApplicationAction} className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-6">
        {job ? <input type="hidden" name="jobId" value={job.id} /> : null}
        {job ? <input type="hidden" name="source" value={job.listingKind === "user_import" ? "user_import" : "discover"} /> : null}
        <Field label="Company">
          <Input name="companyName" required defaultValue={job?.companyName ?? ""} />
        </Field>
        <Field label="Role title">
          <Input name="title" required defaultValue={job?.title ?? ""} />
        </Field>
        <Field label="Employer apply URL" hint="Optional. Must be a public https link.">
          <Input name="applyUrl" type="url" defaultValue={job?.applyUrl ?? ""} />
        </Field>
        <Field label="Stage">
          <select
            name="stage"
            defaultValue="saved"
            className="min-h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
          >
            {APPLICATION_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {APPLICATION_STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Linked resume version" hint="Optional. Does not copy resume JSON.">
          <select
            name="resumeVersionId"
            defaultValue=""
            className="min-h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.title} · v{version.versionNumber}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <Textarea name="notes" />
        </Field>
        {!job && saved.length > 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">
            Or start from a saved job:{" "}
            {saved.slice(0, 5).map((row) => (
              <a key={row.saved.id} className="mr-2 text-[var(--color-accent)]" href={`/applications/new?jobId=${row.job.id}`}>
                {row.job.title}
              </a>
            ))}
          </p>
        ) : null}
        <Button type="submit">Create application</Button>
      </form>
    </div>
  );
}
