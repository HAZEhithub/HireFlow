import { isAdminUser, rateLimit, rateLimitSubject } from "@hireflow/config";
import { decrementUsagePeriod, getDb, profile, user } from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import {
  FRESHNESS_COPY,
  freshnessCopy,
  JOB_FILTER_FACETS,
  addEmployerBoard,
  claimUrlImportQuota,
  getCompanyBriefForUser,
  getJobForUser,
  JobBriefError,
  importUserJob,
  ingestJobs,
  listIngestRuns,
  listSavedJobs,
  parseJobSearch,
  saveJobForUser,
  searchJobs,
  setEmployerBoardActive,
  stableId,
  unsaveJobForUser,
  upsertCanonicalJobs,
} from "@hireflow/jobs";
import { getEvidenceMapForUser } from "@hireflow/applications";
import { matchJobToProfile } from "@hireflow/matching";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";
import { z } from "zod";

const importSchema = z.object({
  applyUrl: z.string().url(),
  title: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  descriptionText: z.string().max(20_000).optional(),
  location: z.string().max(200).optional(),
  employmentType: z.string().max(40).optional(),
  workplaceType: z.string().max(40).optional(),
  salaryMin: z.number().int().nonnegative().nullable().optional(),
  salaryMax: z.number().int().nonnegative().nullable().optional(),
  salaryCurrency: z.string().max(3).optional(),
  notes: z.string().max(2000).optional(),
  extractMetadata: z.boolean().optional(),
});

const ingestSchema = z.object({
  fixtures: z.boolean().optional(),
  adapter: z.enum(["greenhouse", "lever", "ashby"]).optional(),
  boardId: z.string().max(120).optional(),
});

const boardSchema = z.object({
  adapter: z.enum(["greenhouse", "lever", "ashby"]),
  boardIdentifier: z.string().min(1).max(120),
  employerDisplayName: z.string().min(1).max(200),
  employerWebsite: z.string().url().optional(),
  careerPageUrl: z.string().url().optional(),
  supportedCountries: z.array(z.string().max(2)).optional(),
  sourceDocumentationUrl: z.string().url().optional(),
  termsNotes: z.string().max(2000).optional(),
});

type AuthedUser = { id: string; email?: string | null; emailVerified?: boolean | null };

export function registerJobRoutes(
  app: Hono,
  requireUser: (c: { req: { raw: Request } }) => Promise<AuthedUser | null>,
) {
  app.get("/v1/jobs/filters", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "jobs.search_filters");
    return c.json({ filters: JOB_FILTER_FACETS, freshness: FRESHNESS_COPY });
  });

  app.get("/v1/jobs", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "jobs.discover");
    await assertEntitlement(u.id, "jobs.search_filters");
    const url = new URL(c.req.url);
    const query = parseJobSearch(Object.fromEntries(url.searchParams.entries()));
    const db = await getDb();
    const result = await searchJobs(db, u.id, query);
    const p = await db.query.profile.findFirst({ where: eq(profile.userId, u.id) });
    return c.json({
      ...result,
      results: result.results.map((row) => ({
        ...serializeJob(row),
        match: matchJobToProfile(row, p ?? null),
      })),
    });
  });

  app.get("/v1/jobs/saved", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "jobs.save");
    const db = await getDb();
    const q = new URL(c.req.url).searchParams.get("q") ?? undefined;
    const rows = await listSavedJobs(db, u.id, { q: q || undefined });
    return c.json({
      results: rows.map((row) => ({
        ...serializeJob({ ...row.job, companyName: row.company.name, saved: true }),
        savedAt: row.saved.savedAt,
        notes: row.saved.notes,
      })),
    });
  });

  app.get("/v1/jobs/:id", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "jobs.discover");
    const db = await getDb();
    const row = await getJobForUser(db, u.id, c.req.param("id"));
    if (!row) return c.json({ error: "not_found" }, 404);
    const p = await db.query.profile.findFirst({ where: eq(profile.userId, u.id) });
    return c.json({ job: { ...serializeJob(row), match: matchJobToProfile(row, p ?? null) } });
  });

  app.get("/v1/jobs/:id/evidence-map", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    const resumeVersionId = c.req.query("resumeVersionId") || undefined;
    try {
      return c.json(await getEvidenceMapForUser(db, u.id, c.req.param("id"), resumeVersionId));
    } catch (error) {
      if (error instanceof JobBriefError) {
        return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      }
      throw error;
    }
  });

  app.get("/v1/jobs/:id/brief", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const db = await getDb();
    try {
      return c.json(await getCompanyBriefForUser(db, u.id, c.req.param("id")));
    } catch (error) {
      if (error instanceof JobBriefError) {
        return c.json({ error: error.code, message: error.message }, error.httpStatus as 400);
      }
      throw error;
    }
  });

  app.post("/v1/jobs/:id/save", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "jobs.save");
    const db = await getDb();
    const row = await getJobForUser(db, u.id, c.req.param("id"));
    if (!row) return c.json({ error: "not_found" }, 404);
    const body = await readJsonSafe(c);
    const notes = typeof body?.notes === "string" ? body.notes.slice(0, 2000) : undefined;
    await saveJobForUser(db, u.id, row.id, notes);
    return c.json({ ok: true });
  });

  app.delete("/v1/jobs/:id/save", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    await assertEntitlement(u.id, "jobs.save");
    const db = await getDb();
    await unsaveJobForUser(db, u.id, c.req.param("id"));
    return c.json({ ok: true });
  });

  app.post("/v1/jobs/import", async (c) => {
    const u = await requireUser(c);
    if (!u) return c.json({ error: "unauthorized" }, 401);
    const limitedUser = rateLimit({ key: `import:user:${u.id}`, limit: 20, windowMs: 60 * 60_000 });
    const limitedIp = rateLimit({
      key: `import:ip:${rateLimitSubject(c.req.raw.headers)}`,
      limit: 40,
      windowMs: 60 * 60_000,
    });
    if (!limitedUser.ok || !limitedIp.ok) return c.json({ error: "too_many_requests" }, 429);
    const db = await getDb();
    const json = await readJsonSafe(c);
    if (json == null) return c.json({ error: "invalid_json" }, 400);
    const parsed = importSchema.safeParse(json);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    await claimUrlImportQuota(db, u.id);
    try {
      const imported = await importUserJob(parsed.data, { userId: u.id });
      const counts = await upsertCanonicalJobs(db, [imported.job]);
      const stored = await getJobForUser(db, u.id, jobIdFor(imported.job));
      return c.json({
        ok: true,
        extractionError: imported.extractionError,
        injectionFlagged: imported.injectionFlagged,
        counts,
        job: stored ? serializeJob(stored) : null,
      });
    } catch (error) {
      await decrementUsagePeriod(db, u.id, "jobs.url_import_per_month");
      return c.json({ error: error instanceof Error ? error.message : "import_failed" }, 400);
    }
  });

  app.post("/v1/admin/jobs/ingest", async (c) => {
    const admin = await requireAdmin(c, requireUser);
    if (!admin.ok) return c.json({ error: admin.error }, admin.status);
    const u = admin.user;
    const ingestLimited = rateLimit({ key: `admin-ingest:${u.id}`, limit: 10, windowMs: 60 * 60_000 });
    if (!ingestLimited.ok) return c.json({ error: "too_many_requests" }, 429);
    const json = (await readJsonSafe(c)) ?? {};
    const parsed = ingestSchema.safeParse(json);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    const db = await getDb();
    const report = await ingestJobs(db, parsed.data);
    return c.json(report);
  });

  app.get("/v1/admin/jobs/runs", async (c) => {
    const admin = await requireAdmin(c, requireUser);
    if (!admin.ok) return c.json({ error: admin.error }, admin.status);
    const db = await getDb();
    const runs = await listIngestRuns(db, 50);
    return c.json({ runs });
  });

  app.post("/v1/admin/jobs/boards", async (c) => {
    const admin = await requireAdmin(c, requireUser);
    if (!admin.ok) return c.json({ error: admin.error }, admin.status);
    const json = await readJsonSafe(c);
    if (json == null) return c.json({ error: "invalid_json" }, 400);
    const parsed = boardSchema.safeParse(json);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
    const db = await getDb();
    const id = await addEmployerBoard(db, parsed.data);
    return c.json({ ok: true, id });
  });

  app.post("/v1/admin/jobs/boards/:id/active", async (c) => {
    const admin = await requireAdmin(c, requireUser);
    if (!admin.ok) return c.json({ error: admin.error }, admin.status);
    const body = await readJsonSafe(c);
    if (body == null) return c.json({ error: "invalid_json" }, 400);
    const active = Boolean(body.active);
    const db = await getDb();
    await setEmployerBoardActive(db, c.req.param("id"), active);
    return c.json({ ok: true, active });
  });
}

async function requireAdmin(
  c: { req: { raw: Request } },
  requireUser: (c: { req: { raw: Request } }) => Promise<AuthedUser | null>,
): Promise<{ ok: true; user: AuthedUser } | { ok: false; status: 401 | 403; error: "unauthorized" | "forbidden" }> {
  const u = await requireUser(c);
  if (!u) return { ok: false, status: 401, error: "unauthorized" };
  const db = await getDb();
  const row = await db.query.user.findFirst({ where: eq(user.id, u.id) });
  if (
    !isAdminUser({
      id: u.id,
      email: row?.email ?? u.email,
      emailVerified: row?.emailVerified ?? false,
    })
  ) {
    return { ok: false, status: 403, error: "forbidden" };
  }
  return { ok: true, user: u };
}

async function readJsonSafe(c: { req: { text: () => Promise<string> } }): Promise<Record<string, unknown> | null> {
  try {
    const text = await c.req.text();
    if (!text.trim()) return {};
    const value = JSON.parse(text) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  } catch {
    return null;
  }
}

function jobIdFor(row: { source: string; boardId?: string; externalId: string }) {
  return stableId(["job", row.source, row.boardId ?? "", row.externalId]);
}

function serializeJob(row: {
  id: string;
  title: string;
  companyName: string;
  applyUrl: string;
  source: string;
  listingKind: string;
  workplaceType: string;
  employmentType: string;
  city: string | null;
  country: string | null;
  locationText: string | null;
  department: string | null;
  descriptionText: string;
  requiredSkills: string[];
  preferredSkills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryDisclosure: string;
  publishedAt: Date | null;
  firstSeen: Date;
  lastVerified: Date;
  status: string;
  freshnessLabel: string;
  saved?: boolean;
  importNotes?: string | null;
  injectionFlagged?: boolean | null;
  applyUrlStatus?: string | null;
  signals?: Array<{ kind: string; message: string }>;
}) {
  return {
    id: row.id,
    title: row.title,
    companyName: row.companyName,
    applyUrl: row.applyUrl,
    source: row.source,
    listingKind: row.listingKind,
    workplaceType: row.workplaceType,
    employmentType: row.employmentType,
    city: row.city,
    country: row.country,
    locationText: row.locationText,
    department: row.department,
    descriptionText: row.descriptionText,
    requiredSkills: row.requiredSkills,
    preferredSkills: row.preferredSkills,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryCurrency: row.salaryCurrency,
    salaryDisclosure: row.salaryDisclosure,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    firstSeen: row.firstSeen.toISOString(),
    lastVerified: row.lastVerified.toISOString(),
    status: row.status,
    freshnessLabel: row.freshnessLabel,
    freshness: freshnessCopy(row.freshnessLabel, row.listingKind),
    saved: row.saved ?? false,
    importNotes: row.listingKind === "user_import" ? (row.importNotes ?? null) : null,
    injectionFlagged: Boolean(row.injectionFlagged),
    applyUrlStatus: row.applyUrlStatus ?? "unchecked",
    signals: (row.signals ?? []).map((signal) => ({ kind: signal.kind, message: signal.message })),
    sourceAttribution:
      row.listingKind === "fixture"
        ? "Development sample — not a live opening."
        : row.listingKind === "user_import"
          ? "Imported by you. Not retrieved from an employer board API."
          : `Retrieved from the ${row.source} public job board API. Retrieval is not independent employer verification.`,
  };
}
