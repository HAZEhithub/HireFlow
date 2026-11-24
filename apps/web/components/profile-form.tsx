import { EMPLOYMENT_TYPES, PROFILE_STATUSES, WORKPLACE_PREFERENCES } from "@hireflow/shared";
import { Button, Field, Input, Textarea } from "@hireflow/ui";
import type { profile } from "@hireflow/db";

type Profile = typeof profile.$inferSelect;

function csv(value: string[] | null | undefined) {
  return value?.join(", ") ?? "";
}

export function ProfileForm({
  data,
  action,
  submitLabel,
}: {
  data: Profile;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <Field label="Professional headline">
        <Input name="headline" defaultValue={data.headline ?? ""} maxLength={160} />
      </Field>
      <Field label="Summary" hint="Your words. We will not invent achievements later.">
        <Textarea name="summary" defaultValue={data.summary ?? ""} maxLength={4000} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Location">
          <Input name="location" defaultValue={data.location ?? ""} placeholder="Bengaluru, India" />
        </Field>
        <Field label="Country code">
          <Input name="countryCode" defaultValue={data.countryCode ?? "IN"} maxLength={2} />
        </Field>
      </div>
      <Field label="Preferred countries" hint="Comma-separated ISO codes, e.g. IN, DE, SG">
        <Input name="preferredCountries" defaultValue={csv(data.preferredCountries)} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Workplace">
          <select
            name="workplacePreference"
            defaultValue={data.workplacePreference}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
          >
            {WORKPLACE_PREFERENCES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Current status">
          <select
            name="status"
            defaultValue={data.status}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
          >
            {PROFILE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Desired job titles" hint="Comma-separated">
        <Input name="desiredTitles" defaultValue={csv(data.desiredTitles)} placeholder="Software Engineer, Data Analyst" />
      </Field>
      <Field label="Industries" hint="Comma-separated">
        <Input name="industries" defaultValue={csv(data.industries)} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Experience level">
          <Input name="experienceLevel" defaultValue={data.experienceLevel ?? ""} placeholder="Internship, 0-2 years…" />
        </Field>
        <Field label="Salary expectation (annual)">
          <div className="flex gap-2">
            <Input name="salaryCurrency" defaultValue={data.salaryCurrency} className="w-24" />
            <Input
              name="salaryMin"
              type="number"
              min={0}
              defaultValue={data.salaryMin ?? undefined}
              placeholder="Optional"
            />
          </div>
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          Employment types
        </legend>
        <div className="flex flex-wrap gap-3">
          {EMPLOYMENT_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="employmentTypes"
                value={t}
                defaultChecked={data.employmentTypes?.includes(t)}
              />
              {t.replace("_", " ")}
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        label="Work authorization (as you state it)"
        hint="Never treated as verified visa status."
      >
        <Input name="workAuthorization" defaultValue={data.workAuthorization ?? ""} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="relocation" defaultChecked={data.relocation} />
        Open to relocation
      </label>
      <Field label="Availability">
        <Input name="availability" defaultValue={data.availability ?? ""} placeholder="Immediate, after exams…" />
      </Field>
      <Field label="Portfolio URL">
        <Input name="portfolioUrl" type="url" defaultValue={data.portfolioUrl ?? ""} />
      </Field>
      <Field label="LinkedIn URL">
        <Input name="linkedinUrl" type="url" defaultValue={data.linkedinUrl ?? ""} />
      </Field>
      <Field label="GitHub URL">
        <Input name="githubUrl" type="url" defaultValue={data.githubUrl ?? ""} />
      </Field>
      <Field label="Skills" hint="Comma-separated. Optional.">
        <Input name="skills" defaultValue={csv(data.skills)} placeholder="Python, SQL, communication" />
      </Field>
      <Field label="Education" hint="One line per item. Optional. Example: NIT Trichy — B.Tech CSE — 2025">
        <Textarea
          name="education"
          defaultValue={(data.education as { label?: string }[] | null)?.map((row) => row.label).filter(Boolean).join("\n") ?? ""}
        />
      </Field>
      <Field label="Work experience" hint="One line per role. Optional.">
        <Textarea
          name="experience"
          defaultValue={(data.experience as { label?: string }[] | null)?.map((row) => row.label).filter(Boolean).join("\n") ?? ""}
        />
      </Field>
      <Field label="Certifications" hint="One line per credential. Optional.">
        <Textarea
          name="certifications"
          defaultValue={(data.certifications as { label?: string }[] | null)?.map((row) => row.label).filter(Boolean).join("\n") ?? ""}
        />
      </Field>
      <Field label="Projects" hint="One line per project. Optional. You approve anything later used in a resume.">
        <Textarea
          name="projects"
          defaultValue={(data.projects as { label?: string }[] | null)?.map((row) => row.label).filter(Boolean).join("\n") ?? ""}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="openToInternships" defaultChecked={data.openToInternships} />
        Open to internships
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="openToInternational" defaultChecked={data.openToInternational} />
        Open to international / remote-abroad roles
      </label>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
