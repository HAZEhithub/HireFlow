import { JOB_FILTER_FACETS } from "@hireflow/jobs";
import { Button, Input, Label } from "@hireflow/ui";
import Link from "next/link";
import { jobsFilterHref } from "./jobs-filter-href";

const selectClass =
  "min-h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm";

export function FiltersForm({
  values,
  availability,
  openToInternships,
}: {
  values: Record<string, string | undefined>;
  availability?: string | null;
  openToInternships?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm" aria-label="Role type shortcuts">
        <Link className="inline-flex min-h-6 items-center text-[var(--color-accent)]" href={jobsFilterHref(values, "internship")}>
          Internships
        </Link>
        <span aria-hidden="true">·</span>
        <Link className="inline-flex min-h-6 items-center text-[var(--color-accent)]" href={jobsFilterHref(values, "full_time")}>
          Full-time
        </Link>
        <span aria-hidden="true">·</span>
        <Link className="inline-flex min-h-6 items-center text-[var(--color-accent)]" href={jobsFilterHref(values)}>
          Any employment
        </Link>
        {openToInternships ? (
          <span className="text-[var(--color-ink-soft)]">Profile is open to internships — filters stay in your control.</span>
        ) : null}
      </div>
      {availability ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Your availability: {availability}. Listings do not carry start dates unless the employer provided them.</p>
      ) : null}
      <form method="get" className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label htmlFor="job-q">Keywords</Label>
          <Input id="job-q" name="q" defaultValue={values.q ?? ""} placeholder="Title, company, or skill" />
        </div>
        <div>
          <Label htmlFor="job-country">Country</Label>
          <Input id="job-country" name="country" defaultValue={values.country ?? ""} placeholder="IN" />
        </div>
        <div>
          <Label htmlFor="job-city">City</Label>
          <Input id="job-city" name="city" defaultValue={values.city ?? ""} placeholder="Bengaluru" />
        </div>
        <div>
          <Label htmlFor="job-workplace">Workplace</Label>
          <select
            key={`workplace-${values.workplace ?? "any"}`}
            id="job-workplace"
            name="workplace"
            defaultValue={values.workplace ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            {JOB_FILTER_FACETS.workplace.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="job-employment">Employment</Label>
          <select
            key={`employment-${values.employment ?? "any"}`}
            id="job-employment"
            name="employment"
            defaultValue={values.employment ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            {JOB_FILTER_FACETS.employment.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="job-sort">Sort</Label>
          <select
            key={`sort-${values.sort ?? "relevance"}`}
            id="job-sort"
            name="sort"
            defaultValue={values.sort ?? "relevance"}
            className={selectClass}
          >
            {JOB_FILTER_FACETS.sort.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="job-title">Title</Label>
          <Input id="job-title" name="title" defaultValue={values.title ?? ""} placeholder="Engineer" />
        </div>
        <div>
          <Label htmlFor="job-company">Company</Label>
          <Input id="job-company" name="company" defaultValue={values.company ?? ""} placeholder="Acme" />
        </div>
        <div>
          <Label htmlFor="job-skill">Skill</Label>
          <Input id="job-skill" name="skill" defaultValue={values.skill ?? ""} placeholder="TypeScript" />
        </div>
        <div>
          <Label htmlFor="job-posted-after">Posted after</Label>
          <Input id="job-posted-after" name="postedAfter" type="date" defaultValue={values.postedAfter ?? ""} />
        </div>
        <div className="flex items-end">
          <Button type="submit">Search</Button>
        </div>
      </form>
    </div>
  );
}
