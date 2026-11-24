import { exportWorkspace } from "@hireflow/applications";
import { getDb, notification, profile, resume, savedJob, userSettings } from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import { eq } from "drizzle-orm";
import { currentSession } from "../../../lib/session";

export async function GET() {
  const session = await currentSession();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  await assertEntitlement(session.user.id, "account.export");
  const db = await getDb();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, session.user.id) });
  const s = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });
  const notes = await db.query.notification.findMany({
    where: eq(notification.userId, session.user.id),
  });
  const resumes = await db.query.resume.findMany({ where: eq(resume.userId, session.user.id) });
  const saved = await db.query.savedJob.findMany({ where: eq(savedJob.userId, session.user.id) });
  const workspace = await exportWorkspace(db, session.user.id);
  return Response.json({
    exportedAt: new Date().toISOString(),
    user: { id: session.user.id, name: session.user.name, email: session.user.email },
    profile: p,
    settings: s,
    notifications: notes,
    savedJobs: saved,
    resumes: resumes.map((row) => ({
      id: row.id,
      title: row.title,
      originKind: row.originKind,
      templateId: row.templateId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    applications: workspace.applications,
    applicationEvents: workspace.events,
    followUps: workspace.followUps,
    evidence: workspace.evidence,
    applicationPackItems: workspace.packItems,
  }, {
    headers: {
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
      "Content-Disposition": 'attachment; filename="hireflow-export.json"',
    },
  });
}
