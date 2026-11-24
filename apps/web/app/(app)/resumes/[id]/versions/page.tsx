import { getDb } from "@hireflow/db";
import { getResume } from "@hireflow/resumes";
import { Button, Card, Field, Input, TrustChip } from "@hireflow/ui";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../lib/session";
import { deleteResumeAction, duplicateResumeAction, restoreVersionAction, snapshotResumeAction } from "../../actions";

export default async function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  let detail;
  try {
    detail = await getResume(db, user.id, id);
  } catch {
    notFound();
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Versions</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          The original version is never overwritten. Restore creates a new working copy.
        </p>
      </div>
      <Card>
        <form action={snapshotResumeAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="resumeId" value={id} />
          <Field label="Version note">
            <Input name="notes" placeholder="Before tailoring" />
          </Field>
          <Button type="submit">Save version</Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={duplicateResumeAction}>
            <input type="hidden" name="resumeId" value={id} />
            <Button type="submit" variant="secondary">
              Duplicate resume
            </Button>
          </form>
          <form action={deleteResumeAction}>
            <input type="hidden" name="resumeId" value={id} />
            <Button type="submit" variant="danger">
              Delete resume
            </Button>
          </form>
        </div>
      </Card>
      <div className="space-y-3">
        {detail.versions.map((version) => (
          <Card key={version.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Version {version.versionNumber}</p>
                <p className="text-sm text-[var(--color-ink-soft)]">{version.notes || "No note"}</p>
              </div>
              <div className="flex items-center gap-2">
                {version.isOriginal ? <TrustChip tone="good">Original</TrustChip> : null}
                {version.id === detail.resume.currentVersionId ? <TrustChip>Current</TrustChip> : null}
                {version.id !== detail.resume.currentVersionId ? (
                  <form action={restoreVersionAction}>
                    <input type="hidden" name="resumeId" value={id} />
                    <input type="hidden" name="versionId" value={version.id} />
                    <Button type="submit" variant="secondary">
                      Restore
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
