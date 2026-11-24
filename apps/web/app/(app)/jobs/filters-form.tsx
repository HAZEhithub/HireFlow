import { JOB_FILTER_FACETS } from "@hireflow/jobs";
import { Button, Input, Label } from "@hireflow/ui";

export function FiltersForm({ values }: { values: Record<string, string | undefined> }) {
  return (
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
          id="job-workplace"
          name="workplace"
          defaultValue={values.workplace ?? ""}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
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
          id="job-employment"
          name="employment"
          defaultValue={values.employment ?? ""}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
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
          id="job-sort"
          name="sort"
          defaultValue={values.sort ?? "relevance"}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
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
  );
}
