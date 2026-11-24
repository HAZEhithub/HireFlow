import { listEvidence } from "@hireflow/applications";
import { getDb } from "@hireflow/db";
import { isSafeApplyHref } from "@hireflow/jobs";
import { EVIDENCE_KINDS } from "@hireflow/shared";
import { Button, Card, EmptyState, Field, Input, Textarea, TrustChip } from "@hireflow/ui";
import { requireUser } from "../../../lib/session";
import { createEvidenceAction, deleteEvidenceAction } from "../applications/actions";

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const error = typeof raw.error === "string" ? raw.error : undefined;
  const db = await getDb();
  const items = await listEvidence(db, user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Workspace</p>
        <h1 className="font-display mt-1 text-4xl">Career Evidence Vault</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Store proof you already have: a project, internship letter, transcript line, demo URL, or a
          metric you typed. HireFlow quotes these as user-provided and does not scrape LinkedIn.
          Free plan: 10 items.
        </p>
      </div>
      <TrustChip>Quoted as user-provided — never invented</TrustChip>
      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--color-warn)] px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Card>
        <h2 className="font-display text-xl">Add evidence</h2>
        <form action={createEvidenceAction} className="mt-4 grid gap-3">
          <Field label="Kind">
            <select
              name="kind"
              className="min-h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
            >
              {EVIDENCE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <Input name="title" required placeholder="Campus internship completion letter" />
          </Field>
          <Field label="Your notes">
            <Textarea name="body" />
          </Field>
          <Field label="URL" hint="Optional public https link you control.">
            <Input name="url" type="url" />
          </Field>
          <Button type="submit">Save evidence</Button>
        </form>
      </Card>
      {items.length === 0 ? (
        <EmptyState
          title="No evidence items yet"
          body="Add a project or letter you can later attach to a job-fit explanation. Do not paste secrets or other people’s data."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{item.kind}</p>
                  <h2 className="font-display mt-1 text-2xl">{item.title}</h2>
                  {item.body ? <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{item.body}</p> : null}
                  {item.url && isSafeApplyHref(item.url) ? (
                    <p className="mt-2 text-sm">
                      <a className="text-[var(--color-accent)]" href={item.url} rel="noreferrer" target="_blank">
                        {item.url}
                      </a>
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--color-ink-soft)]">Quoted as {item.quotedAs}</p>
                </div>
                <form action={deleteEvidenceAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="ghost">
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
