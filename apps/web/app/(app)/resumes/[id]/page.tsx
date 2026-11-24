import { getDb } from "@hireflow/db";
import { getResume } from "@hireflow/resumes";
import type { ResumeTemplateId } from "@hireflow/shared";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../lib/session";
import { ResumeEditor } from "./editor";

export default async function ResumeEditorPage({ params }: { params: Promise<{ id: string }> }) {
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
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Editor</p>
        <h1 className="font-display mt-1 text-4xl">{detail.resume.title}</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Autosave writes a working copy. The original uploaded version stays frozen.
        </p>
      </div>
      <ResumeEditor
        resumeId={detail.resume.id}
        title={detail.resume.title}
        templateId={detail.resume.templateId as ResumeTemplateId}
        initial={detail.content}
      />
    </div>
  );
}
