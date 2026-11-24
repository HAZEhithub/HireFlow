import { ApplicationError, exportWorkspace } from "@hireflow/applications";
import { JobBriefError } from "@hireflow/jobs";
import { getAuth, getSession, revokeSession } from "@hireflow/auth";
import { flags, rateLimit, rateLimitSubject, urls } from "@hireflow/config";
import {
  completenessFrom,
  countAiUsageThisMonth,
  countUsageEvents,
  ensureUserWorkspace,
  getDb,
  getUsagePeriodCount,
  notification,
  profile,
  resume,
  savedJob,
  user,
  userSettings,
} from "@hireflow/db";
import { EntitlementError, assertEntitlement, publicCatalog } from "@hireflow/entitlements";
import { profileSchema, settingsSchema } from "@hireflow/shared";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { purgeUserResumeFiles } from "@hireflow/resumes";
import { registerApplicationRoutes } from "./applications-routes";
import { registerJobRoutes } from "./jobs-routes";
import { registerResumeRoutes } from "./resumes-routes";

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    secureHeaders({
      xFrameOptions: "DENY",
      xContentTypeOptions: "nosniff",
    }),
  );
  app.use(
    "*",
    cors({
      origin: [urls.app, urls.marketing],
      credentials: true,
    }),
  );

  app.use("/api/auth/*", async (c, next) => {
    const subject = rateLimitSubject(c.req.raw.headers);
    const limited = rateLimit({ key: `auth:${subject}`, limit: 30, windowMs: 60_000 });
    if (!limited.ok) return c.json({ error: "too_many_requests" }, 429);
    await next();
  });

  app.on(["GET", "POST"], "/api/auth/*", async (c) => {
    const auth = await getAuth();
    return auth.handler(c.req.raw);
  });

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "hireflow-api",
      flags,
      billingLive: publicCatalog().billingLive,
    }),
  );

  async function readJson(c: { req: { json: () => Promise<unknown> } }) {
    try {
      return { ok: true as const, value: await c.req.json() };
    } catch {
      return { ok: false as const };
    }
  }

  function clearSessionCookies(response: Response) {
    response.headers.append(
      "Set-Cookie",
      "better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    );
    response.headers.append(
      "Set-Cookie",
      "__Secure-better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure",
    );
    return response;
  }

  async function requireUser(c: { req: { raw: Request } }) {
    const session = await getSession(c.req.raw.headers);
    if (!session?.user) return null;
    const db = await getDb();
    await ensureUserWorkspace(db, session.user.id);
    return session.user;
  }

  app.get("/v1/entitlements", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "usage.read");
    return c.json(publicCatalog());
  });

  app.get("/v1/profile", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "profile.read_write");
    const db = await getDb();
    const row = await db.query.profile.findFirst({ where: eq(profile.userId, u.id) });
    return c.json({ profile: row ?? null, user: { id: u.id, name: u.name, email: u.email } });
  });

  app.patch("/v1/profile", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "profile.read_write");
    const body = await readJson(c);
    if (!body.ok) return c.json({ error: "invalid_json" }, 400);
    const parsed = profileSchema.safeParse(body.value);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    const db = await getDb();
    const existing = await db.query.profile.findFirst({ where: eq(profile.userId, u.id) });
    if (!existing) return c.json({ error: "profile missing" }, 404);
    const completeness = completenessFrom({ ...existing, ...parsed.data });
    await db
      .update(profile)
      .set({ ...parsed.data, completeness, updatedAt: new Date() })
      .where(eq(profile.userId, u.id));
    return c.json({ ok: true, completeness });
  });

  app.get("/v1/settings", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "settings.read_write");
    const db = await getDb();
    const row = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, u.id) });
    return c.json({ settings: row ?? null });
  });

  app.patch("/v1/settings", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "settings.read_write");
    const body = await readJson(c);
    if (!body.ok) return c.json({ error: "invalid_json" }, 400);
    const parsed = settingsSchema.safeParse(body.value);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    const db = await getDb();
    await db
      .update(userSettings)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(userSettings.userId, u.id));
    return c.json({ ok: true });
  });

  app.get("/v1/notifications", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "notifications.inbox");
    const db = await getDb();
    const rows = await db.query.notification.findMany({
      where: eq(notification.userId, u.id),
    });
    const unreadCount = rows.filter((row) => !row.readAt).length;
    return c.json({ notifications: rows, unreadCount });
  });

  app.post("/v1/notifications/:id/read", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "notifications.inbox");
    const id = c.req.param("id");
    const db = await getDb();
    const updated = await db
      .update(notification)
      .set({ readAt: new Date() })
      .where(and(eq(notification.id, id), eq(notification.userId, u.id)))
      .returning({ id: notification.id });
    if (updated.length === 0) return c.json({ error: "not_found" }, 404);
    return c.json({ ok: true });
  });

  app.post("/v1/notifications/read-all", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "notifications.inbox");
    const db = await getDb();
    await db
      .update(notification)
      .set({ readAt: new Date() })
      .where(and(eq(notification.userId, u.id), isNull(notification.readAt)));
    return c.json({ ok: true });
  });

  app.get("/v1/usage", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "usage.read");
    const db = await getDb();
    const events = await countUsageEvents(db, u.id);
    const aiAssistsUsed = await getUsagePeriodCount(db, u.id, "ai.assists_per_month");
    const aiSuccessThisMonth = await countAiUsageThisMonth(db, u.id);
    return c.json({
      aiAssistsUsed,
      aiSuccessThisMonth,
      requestEvents: events,
      flags,
      emailConfigured: Boolean(process.env.RESEND_API_KEY),
      entitlements: publicCatalog(),
    });
  });

  app.get("/v1/export", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "account.export");
    const db = await getDb();
    const p = await db.query.profile.findFirst({ where: eq(profile.userId, u.id) });
    const s = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, u.id) });
    const notes = await db.query.notification.findMany({ where: eq(notification.userId, u.id) });
    const saved = await db.query.savedJob.findMany({ where: eq(savedJob.userId, u.id) });
    const ownedResumes = await db.query.resume.findMany({ where: eq(resume.userId, u.id) });
    const workspace = await exportWorkspace(db, u.id);
    c.header("Cache-Control", "private, no-store");
    c.header("Pragma", "no-cache");
    c.header("Content-Disposition", 'attachment; filename="hireflow-export.json"');
    return c.json({
      exportedAt: new Date().toISOString(),
      user: { id: u.id, name: u.name, email: u.email },
      profile: p,
      settings: s,
      notifications: notes,
      savedJobs: saved,
      resumes: ownedResumes.map((row) => ({
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
    });
  });

  registerJobRoutes(app, requireUser);
  registerResumeRoutes(app, requireUser);
  registerApplicationRoutes(app, requireUser);

  app.delete("/v1/account", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "account.delete");
    try {
      await revokeSession(c.req.raw.headers);
    } catch {
      /* session row may already be gone */
    }
    const db = await getDb();
    await purgeUserResumeFiles(u.id);
    await db.delete(savedJob).where(eq(savedJob.userId, u.id));
    await db.delete(user).where(eq(user.id, u.id));
    return clearSessionCookies(c.json({ ok: true }));
  });

  app.onError((err, c) => {
    if (err instanceof EntitlementError) {
      return c.json({ error: err.code, key: err.key, plan: err.plan }, err.httpStatus);
    }
    if (err instanceof ApplicationError) {
      return c.json({ error: err.code, message: err.message }, err.httpStatus as 400);
    }
    if (err instanceof JobBriefError) {
      return c.json({ error: err.code, message: err.message }, err.httpStatus as 400);
    }
    console.error("[api]", err instanceof Error ? err.message : "error");
    return c.json({ error: "internal" }, 500);
  });

  return app;
}
