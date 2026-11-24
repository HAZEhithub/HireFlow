import { getDb } from "@hireflow/db";
import { getJobForUser } from "@hireflow/jobs";
import { listResumes } from "@hireflow/resumes";
import { Button, Card, EmptyState } from "@hireflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../lib/session";
import { startTailorAction } from "../../actions";

export default async function ResumeForJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const user = await requireUser();
  const { jobId } = await params;
  const { intent } = await searchParams;
  const db = await getDb();
  const job = await getJobForUser(db, user.id, jobId);
  if (!job) notFound();
  const resumes = await listResumes(db, user.id);
  const tailor = intent === "tailor";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">{tailor ? "Tailor a resume" : "Compare a resume"}</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          {job.title} · {job.companyName}
        </p>
      </div>
      {resumes.length === 0 ? (
        <EmptyState
          title="Create or upload a resume first"
          body="Compatibility and tailoring need a saved resume."
          action={
            <Link href="/resumes/upload" className="text-sm text-[var(--color-accent)]">
              Open Resume Studio
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {resumes.map((resume) => (
            <Card key={resume.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{resume.title}</p>
                <p className="text-sm text-[var(--color-ink-soft)]">{resume.originKind}</p>
              </div>
              {tailor ? (
                <form action={startTailorAction}>
                  <input type="hidden" name="resumeId" value={resume.id} />
                  <input type="hidden" name="jobId" value={jobId} />
                  <Button type="submit">Tailor this resume</Button>
                </form>
              ) : (
                <Link href={`/resumes/${resume.id}/match/${jobId}`}>
                  <Button type="button">Compare compatibility</Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
