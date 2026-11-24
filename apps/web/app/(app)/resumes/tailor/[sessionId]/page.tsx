import { getDb, resumeTailoringSession } from "@hireflow/db";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../lib/session";
import { TailorReview } from "../../tailor-review";

export default async function TailorSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser();
  const { sessionId } = await params;
  const db = await getDb();
  const session = await db.query.resumeTailoringSession.findFirst({
    where: and(eq(resumeTailoringSession.id, sessionId), eq(resumeTailoringSession.userId, user.id)),
  });
  if (!session) notFound();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Tailoring</p>
        <h1 className="font-display mt-1 text-4xl">Review suggested changes</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Accept, reject, or edit each suggestion. The original resume is not modified. HireFlow
          will not add skills or dates that were not already on your resume. Optional local phrasing
          appears only if you consented in Settings and Ollama is running on this machine.
        </p>
      </div>
      <TailorReview
        sessionId={session.id}
        suggestions={
          Array.isArray(session.suggestions)
            ? session.suggestions
            : ((session.suggestions as { suggestions?: never[] })?.suggestions ?? [])
        }
        warnings={
          Array.isArray(session.suggestions)
            ? []
            : ((session.suggestions as { warnings?: string[] })?.warnings ?? [])
        }
      />
    </div>
  );
}
