import { ApplicationError, getApplication, listResumeVersionOptions } from "@hireflow/applications";
import { getDb } from "@hireflow/db";
import { isSafeApplyHref } from "@hireflow/jobs";
import { APPLICATION_PACK_SLOT_IDS, APPLICATION_STAGE_LABELS, APPLICATION_STAGES } from "@hireflow/shared";
import { Button, Card, Field, Input, Textarea, TrustChip } from "@hireflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../lib/session";
import {
  completeFollowUpAction,
  createFollowUpAction,
  deleteApplicationAction,
  savePackItemAction,
  updateApplicationAction,
} from "../actions";

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const raw = await searchParams;
  const error = typeof raw.error === "string" ? raw.error : undefined;
  const db = await getDb();
  let detail;
  try {
    detail = await getApplication(db, user.id, id);
  } catch (caught) {
    if (caught instanceof ApplicationError && caught.code === "not_found") notFound();
    throw caught;
  }
  const versions = await listResumeVersionOptions(db, user.id);
  const row = detail.application;
  const applyOk = row.applyUrl ? isSafeApplyHref(row.applyUrl) : false;

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/applications" className="text-[var(--color-accent)]">
          Back to tracker
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">{row.companyName}</p>
          <h1 className="font-display mt-1 text-4xl">{row.title}</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            {APPLICATION_STAGE_LABELS[row.stage as (typeof APPLICATION_STAGES)[number]] ?? row.stage} ·{" "}
            {row.source.replace("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {applyOk ? (
            <a href={row.applyUrl ?? undefined} target="_blank" rel="noreferrer">
              <Button type="button">Apply on employer site</Button>
            </a>
          ) : (
            <p className="text-sm text-[var(--color-ink-soft)]">No public https apply link on file.</p>
          )}
          {row.jobId ? (
            <Link href={`/jobs/${row.jobId}`}>
              <Button type="button" variant="secondary">
                Open listing
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
      <TrustChip>HireFlow does not submit this application.</TrustChip>
      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--color-warn)] px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Card>
        <h2 className="font-display text-xl">Details</h2>
        <form action={updateApplicationAction} className="mt-4 grid gap-4">
          <input type="hidden" name="id" value={row.id} />
          <Field label="Company">
            <Input name="companyName" defaultValue={row.companyName} required />
          </Field>
          <Field label="Role title">
            <Input name="title" defaultValue={row.title} required />
          </Field>
          <Field label="Stage">
            <select
              key={row.stage}
              name="stage"
              defaultValue={row.stage}
              className="min-h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
            >
              {APPLICATION_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {APPLICATION_STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Linked resume version">
            <select
              key={row.resumeVersionId ?? "none"}
              name="resumeVersionId"
              defaultValue={row.resumeVersionId ?? ""}
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
          <Field label="Employer apply URL">
            <Input name="applyUrl" type="url" defaultValue={row.applyUrl ?? ""} />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" defaultValue={row.notes ?? ""} />
          </Field>
          <Button type="submit" variant="secondary">
            Save changes
          </Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Stage history</h2>
        <ol className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-soft)]">
          {detail.events.map((event) => (
            <li key={event.id}>
              {event.fromStage ?? "created"} → {event.toStage} · {event.at.toISOString().slice(0, 16).replace("T", " ")} UTC
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Follow-ups</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Adding a follow-up creates an inbox note now. The due date is for your planning. Email is not
          sent unless a Resend key is configured later.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {detail.followUps.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2">
              <span>
                {item.title} · due {item.dueAt.toISOString().slice(0, 10)}
                {item.doneAt ? " · done" : ""}
              </span>
              {item.doneAt ? null : (
                <form action={completeFollowUpAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="applicationId" value={row.id} />
                  <Button type="submit" variant="ghost">
                    Mark done
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <form action={createFollowUpAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="applicationId" value={row.id} />
          <Field label="Due date">
            <Input name="dueAt" type="datetime-local" required />
          </Field>
          <Field label="Title">
            <Input name="title" placeholder="Check recruiter reply" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Note">
              <Textarea name="body" />
            </Field>
          </div>
          <Button type="submit" variant="secondary">
            Add in-app follow-up
          </Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Application pack</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{detail.pack.note}</p>
        <div className="mt-4 space-y-4">
          {APPLICATION_PACK_SLOT_IDS.map((slot) => {
            const existing = detail.packItems.find((item) => item.slot === slot);
            const label = detail.pack.slots.find((item) => item.id === slot)?.label ?? slot;
            return (
              <form key={slot} action={savePackItemAction} className="space-y-2">
                <input type="hidden" name="applicationId" value={row.id} />
                <input type="hidden" name="slot" value={slot} />
                <Field label={label} hint={slot === "cover_letter" ? "Paste your letter. AI drafts are not enabled." : "Your text. Quoted as user-provided."}>
                  <Textarea name="body" defaultValue={existing?.body ?? ""} required={slot !== "resume"} />
                </Field>
                <Button type="submit" variant="ghost">
                  Save {label.toLowerCase()}
                </Button>
              </form>
            );
          })}
        </div>
      </Card>
      <form action={deleteApplicationAction}>
        <input type="hidden" name="id" value={row.id} />
        <Button type="submit" variant="danger">
          Delete application
        </Button>
      </form>
    </div>
  );
}
