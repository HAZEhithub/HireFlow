import { getDb } from "@hireflow/db";
import { getParseDraft } from "@hireflow/resumes";
import { emptyStructuredResume, structuredResumeSchema } from "@hireflow/shared";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../lib/session";
import { ReviewForm } from "../../review-form";

export default async function ResumeReviewPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const user = await requireUser();
  const { documentId } = await params;
  const db = await getDb();
  let draft;
  try {
    draft = await getParseDraft(db, user.id, documentId);
  } catch {
    notFound();
  }
  const parsed = structuredResumeSchema.safeParse(draft.content);
  const content = parsed.success ? parsed.data : emptyStructuredResume();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Review</p>
        <h1 className="font-display mt-1 text-4xl">Confirm extracted information</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          HireFlow does not invent employers, dates, or achievements. Correct anything that looks wrong
          before this becomes a saved resume.
        </p>
      </div>
      <ReviewForm
        documentId={documentId}
        filename={String(draft.filename ?? "resume")}
        initial={content}
        warnings={Array.isArray(draft.warnings) ? (draft.warnings as string[]) : []}
        missingFields={Array.isArray(draft.missingFields) ? (draft.missingFields as string[]) : []}
        likelyScanned={Boolean(draft.likelyScanned)}
      />
    </div>
  );
}
