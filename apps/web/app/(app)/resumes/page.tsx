import { getDb } from "@hireflow/db";
import { assertEntitlement, PLANS } from "@hireflow/entitlements";
import { listResumes } from "@hireflow/resumes";
import { Button, Card, EmptyState, TrustChip } from "@hireflow/ui";
import Link from "next/link";
import { requireUser } from "../../../lib/session";
import { createResumeAction } from "./actions";

export default async function ResumesPage() {
  const user = await requireUser();
  await assertEntitlement(user.id, "resumes.studio");
  const db = await getDb();
  const resumes = await listResumes(db, user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Workspace</p>
          <h1 className="font-display mt-1 text-4xl">Resume Studio</h1>
          <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
            Upload a resume, review extracted fields, edit a professional document, compare it with
            a real HireFlow job, and export PDF or DOCX. Parsing and matching work without a paid AI provider.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/resumes/upload">
            <Button type="button">Upload resume</Button>
          </Link>
          <form action={createResumeAction}>
            <Button type="submit" variant="secondary">
              Create blank
            </Button>
          </form>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <TrustChip tone="good">Free plan: {PLANS.free.offerCopy}</TrustChip>
        <TrustChip>Two resume documents on Free</TrustChip>
        <TrustChip>Pro {PLANS.pro.offerCopy} — billing not enabled</TrustChip>
      </div>
      {resumes.length === 0 ? (
        <EmptyState
          title="No resumes yet"
          body="Create a blank resume or upload a PDF, DOCX, or TXT file. You will review every extracted field before anything is saved to your profile."
          action={
            <Link href="/resumes/upload" className="text-sm text-[var(--color-accent)]">
              Upload an existing resume
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resumes.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{item.title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                    {item.originKind} · updated {item.updatedAt.toISOString().slice(0, 10)}
                  </p>
                </div>
                <TrustChip>{item.templateId.replace("-", " ")}</TrustChip>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link className="text-[var(--color-accent)]" href={`/resumes/${item.id}`}>
                  Open editor
                </Link>
                <Link className="text-[var(--color-accent)]" href={`/resumes/${item.id}/analysis`}>
                  Analysis
                </Link>
                <Link className="text-[var(--color-accent)]" href={`/resumes/${item.id}/export`}>
                  Export
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
