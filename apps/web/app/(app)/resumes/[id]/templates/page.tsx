import { getDb } from "@hireflow/db";
import { getResume } from "@hireflow/resumes";
import { RESUME_TEMPLATE_CATALOG, type ResumeTemplateId } from "@hireflow/shared";
import { Button, Card, TrustChip } from "@hireflow/ui";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../lib/session";
import { setTemplateAction } from "../../actions";
import { ResumePreview } from "../preview";

export default async function TemplatesPage({ params }: { params: Promise<{ id: string }> }) {
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
        <h1 className="font-display text-4xl">Templates</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Three ATS-conscious layouts. No claim of universal ATS compatibility. Graphics that hide
          text from parsers are avoided.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {(Object.keys(RESUME_TEMPLATE_CATALOG) as ResumeTemplateId[]).map((templateId) => {
          const meta = RESUME_TEMPLATE_CATALOG[templateId];
          const selected = detail.resume.templateId === templateId;
          return (
            <Card key={templateId}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-xl">{meta.name}</h2>
                {selected ? <TrustChip tone="good">Selected</TrustChip> : null}
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{meta.description}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{meta.audience}</p>
              <form action={setTemplateAction} className="mt-4">
                <input type="hidden" name="resumeId" value={id} />
                <input type="hidden" name="templateId" value={templateId} />
                <Button type="submit" variant={selected ? "secondary" : "primary"}>
                  Use this template
                </Button>
              </form>
              <div className="mt-4 origin-top scale-[0.55] overflow-hidden">
                <ResumePreview resume={detail.content} templateId={templateId} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
