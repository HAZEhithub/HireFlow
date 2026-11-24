import { rateLimit, rateLimitSubject } from "@hireflow/config";
import { getDb } from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import { ResumeError } from "@hireflow/resumes";
import {
  applyTailoring,
  analyzeResumeForUser,
  confirmParsedResume,
  createBlankResume,
  deleteResume,
  duplicateResume,
  exportResumeFile,
  getResume,
  listResumes,
  matchResumeJob,
  parseUploadedResume,
  readOwnedDocument,
  restoreResumeVersion,
  saveResumeContent,
  snapshotResume,
  startTailoring,
} from "@hireflow/resumes";
import { structuredResumeSchema } from "@hireflow/shared";
import type { Hono } from "hono";
import { z } from "zod";

type AuthedUser = { id: string; email?: string | null };

const resumeWrite = z.object({
  title: z.string().max(120).optional(),
  templateId: z
    .enum(["professional-classic", "modern-professional", "compact-technical"])
    .optional(),
  content: structuredResumeSchema.optional(),
  notes: z.string().max(500).optional(),
});

const confirmSchema = z.object({
  documentId: z.string().min(1).max(80),
  title: z.string().max(120).optional(),
  content: structuredResumeSchema,
  copyConfirmedFieldsToProfile: z.boolean().optional(),
});

const tailorApplySchema = z.object({
  decisions: z.record(z.enum(["accept", "reject", "edit"])),
  edits: z.record(z.string().max(800)).optional(),
});

function handleResumeError(error: unknown) {
  if (error instanceof ResumeError) {
    return { status: error.httpStatus, body: { error: error.code, message: error.message } };
  }
  throw error;
}

export function registerResumeRoutes(
  app: Hono,
  requireUser: (c: { req: { raw: Request } }) => Promise<AuthedUser | null>,
) {
  app.get("/v1/resumes", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    return c.json({ resumes: await listResumes(db, u.id) });
  });

  app.post("/v1/resumes", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    let json: unknown = {};
    try {
      json = await c.req.json();
    } catch {
      json = {};
    }
    const parsed = resumeWrite.safeParse(json);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    const db = await getDb();
    try {
      const created = await createBlankResume(db, u.id, parsed.data.title);
      return c.json(created, 201);
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/parse", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const limited = rateLimit({
      key: `resume-parse:${rateLimitSubject(c.req.raw.headers)}`,
      limit: 10,
      windowMs: 60 * 60_000,
    });
    if (!limited.ok) return c.json({ error: "too_many_requests" }, 429);
    await assertEntitlement(u.id, "resumes.parse_export");
    const body = await c.req.parseBody({ all: true });
    const file = body.file;
    if (!(file instanceof File)) return c.json({ error: "file_required" }, 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    const db = await getDb();
    try {
      const parsed = await parseUploadedResume(db, u.id, {
        buffer,
        filename: file.name || "resume",
        mimeType: file.type || "application/octet-stream",
      });
      return c.json(parsed);
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/confirm", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    let json: unknown;
    try {
      json = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    const parsed = confirmSchema.safeParse(json);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    const db = await getDb();
    try {
      return c.json(await confirmParsedResume(db, u.id, parsed.data), 201);
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.get("/v1/resumes/:id", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await getResume(db, u.id, c.req.param("id")));
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.patch("/v1/resumes/:id", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    let json: unknown;
    try {
      json = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    const parsed = resumeWrite.safeParse(json);
    if (!parsed.success || !parsed.data.content) return c.json({ error: "content_required" }, 400);
    const db = await getDb();
    try {
      return c.json(
        await saveResumeContent(db, u.id, c.req.param("id"), {
          content: parsed.data.content,
          templateId: parsed.data.templateId,
          title: parsed.data.title,
        }),
      );
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.delete("/v1/resumes/:id", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await deleteResume(db, u.id, c.req.param("id")));
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.get("/v1/resumes/:id/versions", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      const detail = await getResume(db, u.id, c.req.param("id"));
      return c.json({ versions: detail.versions });
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/:id/versions", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    let notes: string | undefined;
    try {
      const body = (await c.req.json()) as { notes?: string };
      notes = body.notes;
    } catch {
      notes = undefined;
    }
    const db = await getDb();
    try {
      return c.json(await snapshotResume(db, u.id, c.req.param("id"), notes));
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/:id/versions/:versionId/restore", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await restoreResumeVersion(db, u.id, c.req.param("id"), c.req.param("versionId")));
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/:id/duplicate", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await duplicateResume(db, u.id, c.req.param("id")), 201);
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/:id/analyze", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await analyzeResumeForUser(db, u.id, c.req.param("id")));
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/:id/match/:jobId", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await matchResumeJob(db, u.id, c.req.param("id"), c.req.param("jobId")));
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/:id/tailor/:jobId", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await startTailoring(db, u.id, c.req.param("id"), c.req.param("jobId")));
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/tailor/:sessionId/apply", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    let json: unknown;
    try {
      json = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    const parsed = tailorApplySchema.safeParse(json);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    const db = await getDb();
    try {
      return c.json(
        await applyTailoring(db, u.id, c.req.param("sessionId"), parsed.data.decisions, parsed.data.edits),
      );
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.post("/v1/resumes/:id/export", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    let format: "pdf" | "docx" = "pdf";
    try {
      const body = (await c.req.json()) as { format?: string };
      if (body.format === "docx" || body.format === "pdf") format = body.format;
    } catch {
      format = "pdf";
    }
    const db = await getDb();
    try {
      const exported = await exportResumeFile(db, u.id, c.req.param("id"), format);
      return c.json(exported);
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });

  app.get("/v1/resumes/documents/:documentId", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      const { doc, bytes } = await readOwnedDocument(db, u.id, c.req.param("documentId"));
      return new Response(bytes, {
        headers: {
          "content-type": doc.mimeType,
          "content-disposition": `attachment; filename="${doc.originalFilename.replace(/"/g, "")}"`,
          "cache-control": "private, no-store",
        },
      });
    } catch (error) {
      const handled = handleResumeError(error);
      return c.json(handled.body, handled.status);
    }
  });
}
