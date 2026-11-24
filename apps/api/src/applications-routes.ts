import {
  ApplicationError,
  completeFollowUp,
  createApplication,
  createEvidence,
  createFollowUp,
  deleteApplication,
  deleteEvidence,
  getApplication,
  getPipelineAnalytics,
  listApplications,
  listEvidence,
  updateApplication,
  upsertPackItem,
} from "@hireflow/applications";
import { rateLimit } from "@hireflow/config";
import { getDb } from "@hireflow/db";
import type { Hono } from "hono";

type User = { id: string };

export function registerApplicationRoutes(
  app: Hono,
  requireUser: (c: { req: { raw: Request } }) => Promise<User | null>,
) {
  async function readJson(c: { req: { json: () => Promise<unknown> } }) {
    try {
      return { ok: true as const, value: await c.req.json() };
    } catch {
      return { ok: false as const };
    }
  }

  function writeLimited(userId: string) {
    return !rateLimit({ key: `applications:write:${userId}`, limit: 60, windowMs: 60_000 }).ok;
  }

  app.get("/v1/applications", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    const stage = c.req.query("stage");
    return c.json({ results: await listApplications(db, u.id, stage) });
  });

  app.get("/v1/applications/analytics", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    return c.json(await getPipelineAnalytics(db, u.id));
  });

  app.post("/v1/applications", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    if (writeLimited(u.id)) return c.json({ error: "rate_limited" }, 429);
    const body = await readJson(c);
    if (!body.ok) return c.json({ error: "invalid_json" }, 400);
    const db = await getDb();
    try {
      const row = await createApplication(db, u.id, body.value);
      return c.json({ application: row }, 201);
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });

  app.get("/v1/applications/:id", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await getApplication(db, u.id, c.req.param("id")));
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });

  app.patch("/v1/applications/:id", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    if (writeLimited(u.id)) return c.json({ error: "rate_limited" }, 429);
    const body = await readJson(c);
    if (!body.ok) return c.json({ error: "invalid_json" }, 400);
    const db = await getDb();
    try {
      return c.json(await updateApplication(db, u.id, c.req.param("id"), body.value));
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });

  app.delete("/v1/applications/:id", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    if (writeLimited(u.id)) return c.json({ error: "rate_limited" }, 429);
    const db = await getDb();
    try {
      await deleteApplication(db, u.id, c.req.param("id"));
      return c.json({ ok: true });
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });

  app.post("/v1/applications/:id/follow-ups", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    if (writeLimited(u.id)) return c.json({ error: "rate_limited" }, 429);
    const body = await readJson(c);
    if (!body.ok) return c.json({ error: "invalid_json" }, 400);
    const db = await getDb();
    try {
      const row = await createFollowUp(db, u.id, c.req.param("id"), body.value);
      return c.json({ followUp: row }, 201);
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });

  app.post("/v1/follow-ups/:id/complete", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    if (writeLimited(u.id)) return c.json({ error: "rate_limited" }, 429);
    const db = await getDb();
    try {
      return c.json(await completeFollowUp(db, u.id, c.req.param("id")));
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });

  app.post("/v1/applications/:id/pack", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    if (writeLimited(u.id)) return c.json({ error: "rate_limited" }, 429);
    const body = await readJson(c);
    if (!body.ok) return c.json({ error: "invalid_json" }, 400);
    const db = await getDb();
    try {
      const item = await upsertPackItem(db, u.id, c.req.param("id"), body.value);
      return c.json({ item });
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });

  app.get("/v1/evidence", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    return c.json({ results: await listEvidence(db, u.id) });
  });

  app.post("/v1/evidence", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    if (writeLimited(u.id)) return c.json({ error: "rate_limited" }, 429);
    const body = await readJson(c);
    if (!body.ok) return c.json({ error: "invalid_json" }, 400);
    const db = await getDb();
    try {
      const row = await createEvidence(db, u.id, body.value);
      return c.json({ evidence: row }, 201);
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });

  app.delete("/v1/evidence/:id", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    if (writeLimited(u.id)) return c.json({ error: "rate_limited" }, 429);
    const db = await getDb();
    try {
      await deleteEvidence(db, u.id, c.req.param("id"));
      return c.json({ ok: true });
    } catch (error) {
      if (error instanceof ApplicationError) return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      throw error;
    }
  });
}
