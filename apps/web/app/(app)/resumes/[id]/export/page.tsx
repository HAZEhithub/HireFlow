import { getDb } from "@hireflow/db";
import { getResume, listResumeDocuments } from "@hireflow/resumes";
import { Button, Card, TrustChip } from "@hireflow/ui";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../lib/session";
import { exportResumeAction } from "../../actions";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  let detail;
  try {
    detail = await getResume(db, user.id, id);
  } catch {
    notFound();
  }
  const docs = await listResumeDocuments(db, user.id, id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Export</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          PDF is generated with @react-pdf/renderer. DOCX is generated with docx. Downloads are
          authenticated and private.
        </p>
      </div>
      <Card>
        <p className="text-sm">Template: {detail.resume.templateId}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={exportResumeAction}>
            <input type="hidden" name="resumeId" value={id} />
            <input type="hidden" name="format" value="pdf" />
            <Button type="submit">Download PDF</Button>
          </form>
          <form action={exportResumeAction}>
            <input type="hidden" name="resumeId" value={id} />
            <input type="hidden" name="format" value="docx" />
            <Button type="submit" variant="secondary">
              Download DOCX
            </Button>
          </form>
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Export history</h2>
        {docs.filter((row) => row.kind.startsWith("export")).length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">No exports yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {docs
              .filter((row) => row.kind.startsWith("export"))
              .map((row) => (
                <li key={row.id} className="flex flex-wrap items-center gap-2">
                  <TrustChip>{row.kind}</TrustChip>
                  <a className="text-[var(--color-accent)]" href={`/api/resumes/documents/${row.id}`}>
                    {row.originalFilename}
                  </a>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
