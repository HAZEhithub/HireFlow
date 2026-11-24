import { EMPLOYMENT_TYPES, WORKPLACE_PREFERENCES } from "@hireflow/shared";
import { Button, Field, Input, Textarea } from "@hireflow/ui";
import { requireUser } from "../../../../lib/session";
import { importJobAction } from "../actions";

export default async function ImportJobPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const raw = await searchParams;
  const error = typeof raw.error === "string" ? raw.error : undefined;
  const applyUrl = typeof raw.applyUrl === "string" ? raw.applyUrl : "";
  const title = typeof raw.title === "string" ? raw.title : "";
  const companyName = typeof raw.companyName === "string" ? raw.companyName : "";
  const descriptionText = typeof raw.descriptionText === "string" ? raw.descriptionText : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Import a job</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Paste an application URL and the details you want to keep. You can bookmark a Naukri,
          LinkedIn, Indeed, or Workday apply URL with title and description filled in. HireFlow will
          not fetch those pages. Automatic title extraction is optional and limited to Greenhouse,
          Lever, and Ashby hosted pages.
        </p>
      </div>
      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--color-warn)] px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <form action={importJobAction} className="grid max-w-2xl gap-4">
        <Field label="Application URL" hint="https only. Internal and metadata addresses are blocked.">
          <Input name="applyUrl" type="url" required defaultValue={applyUrl} placeholder="https://boards.greenhouse.io/..." />
        </Field>
        <Field label="Job title">
          <Input name="title" required defaultValue={title} />
        </Field>
        <Field label="Company">
          <Input name="companyName" required defaultValue={companyName} />
        </Field>
        <Field label="Location">
          <Input name="location" placeholder="Bengaluru, India" />
        </Field>
        <Field label="Employment type">
          <select
            name="employmentType"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
          >
            <option value="">Not provided</option>
            {EMPLOYMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Workplace">
          <select
            name="workplaceType"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm"
          >
            <option value="">Unknown</option>
            {WORKPLACE_PREFERENCES.filter((value) => value !== "any").map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Salary min">
            <Input name="salaryMin" type="number" min={0} />
          </Field>
          <Field label="Salary max">
            <Input name="salaryMax" type="number" min={0} />
          </Field>
          <Field label="Currency">
            <Input name="salaryCurrency" maxLength={3} placeholder="INR" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea name="descriptionText" defaultValue={descriptionText} />
        </Field>
        <Field label="Notes">
          <Textarea name="notes" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="extractMetadata" />
          Attempt title extraction from allowed public job-board hosts
        </label>
        <Button type="submit">Save imported job</Button>
      </form>
    </div>
  );
}
