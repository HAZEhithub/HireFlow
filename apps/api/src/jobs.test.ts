import "./test-env";

import { randomUUID } from "node:crypto";
import { getDb, job, user } from "@hireflow/db";
import { canonicalUrl, ingestJobs, toUserImportedJob, upsertCanonicalJobs, type CanonicalJob } from "@hireflow/jobs";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";

const origin = "http://localhost:3000";

function cookiesFrom(res: Response) {
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : [];
  return raw
    .filter(Boolean)
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

async function signUp(app: ReturnType<typeof createApp>, email: string) {
  const res = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      Origin: origin,
      Referer: `${origin}/sign-up`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: "password1", name: "Job Seeker" }),
  });
  return { res, cookie: cookiesFrom(res) };
}

describe("jobs API", () => {
  it("searches, filters, paginates, and saves without leaking across users", { timeout: 120_000 }, async () => {
    const db = await getDb();
    await ingestJobs(db, { fixtures: true });
    const app = createApp();
    const a = await signUp(app, `jobs-a-${randomUUID()}@example.com`);
    const b = await signUp(app, `jobs-b-${randomUUID()}@example.com`);
    expect(a.res.status).toBe(200);
    expect(b.res.status).toBe(200);

    const list = await app.request("/v1/jobs?q=intern&country=IN", { headers: { Cookie: a.cookie } });
    expect(list.status).toBe(200);
    const listBody = (await list.json()) as {
      total: number;
      results: Array<{ id: string; title: string; country: string | null }>;
    };
    expect(listBody.total).toBeGreaterThan(0);
    expect(listBody.results.every((row) => row.country === "IN")).toBe(true);

    const remote = await app.request("/v1/jobs?workplace=remote", { headers: { Cookie: a.cookie } });
    const remoteBody = (await remote.json()) as { results: Array<{ workplaceType: string }> };
    expect(remoteBody.results.length).toBeGreaterThan(0);
    expect(remoteBody.results.every((row) => row.workplaceType === "remote")).toBe(true);

    const page1 = await app.request("/v1/jobs?page=1&pageSize=1", { headers: { Cookie: a.cookie } });
    const page1Body = (await page1.json()) as { results: Array<{ id: string }> };
    expect(page1Body.results).toHaveLength(1);
    const page2 = await app.request("/v1/jobs?page=2&pageSize=1", { headers: { Cookie: a.cookie } });
    const page2Body = (await page2.json()) as { results: Array<{ id: string }> };
    expect(page2Body.results[0]?.id).not.toBe(page1Body.results[0]?.id);

    const jobId = listBody.results[0]?.id as string;
    const save = await app.request(`/v1/jobs/${jobId}/save`, {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "follow up" }),
    });
    expect(save.status).toBe(200);
    const saved = await app.request("/v1/jobs/saved", { headers: { Cookie: a.cookie } });
    const savedBody = (await saved.json()) as { results: Array<{ id: string }> };
    expect(savedBody.results.some((row) => row.id === jobId)).toBe(true);
    const otherSaved = await app.request("/v1/jobs/saved", { headers: { Cookie: b.cookie } });
    const otherSavedBody = (await otherSaved.json()) as { results: Array<{ id: string }> };
    expect(otherSavedBody.results.some((row) => row.id === jobId)).toBe(false);

    const unsave = await app.request(`/v1/jobs/${jobId}/save`, {
      method: "DELETE",
      headers: { Cookie: a.cookie },
    });
    expect(unsave.status).toBe(200);
  });

  it("rejects unauthorized ingest, SSRF imports, and cross-user imported jobs", { timeout: 60_000 }, async () => {
    const app = createApp();
    const ingest = await app.request("/v1/admin/jobs/ingest", { method: "POST", body: "{}" });
    expect(ingest.status).toBe(401);
    const a = await signUp(app, `jobs-c-${randomUUID()}@example.com`);
    const forbidden = await app.request("/v1/admin/jobs/ingest", {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ fixtures: true }),
    });
    expect(forbidden.status).toBe(403);

    const db = await getDb();
    const profileRes = await app.request("/v1/profile", { headers: { Cookie: a.cookie } });
    const profileBody = (await profileRes.json()) as { user: { id: string } };
    await upsertCanonicalJobs(db, [
      toUserImportedJob(
        {
          applyUrl: "https://jobs.lever.co/example/secret-import",
          title: "Secret Import",
          companyName: "Example",
          descriptionText: "Private to importer",
        },
        new Date(),
        { userId: profileBody.user.id },
      ),
    ]);
    const b = await signUp(app, `jobs-d-${randomUUID()}@example.com`);
    const visibleA = await app.request("/v1/jobs?q=Secret%20Import", { headers: { Cookie: a.cookie } });
    const visibleB = await app.request("/v1/jobs?q=Secret%20Import", { headers: { Cookie: b.cookie } });
    const bodyA = (await visibleA.json()) as { results: Array<{ id: string; title: string; listingKind: string }> };
    const bodyB = (await visibleB.json()) as { results: Array<{ title: string }> };
    const imported = bodyA.results.find((row) => row.title === "Secret Import" && row.listingKind === "user_import");
    expect(imported).toBeTruthy();
    expect(bodyB.results.some((row) => row.title === "Secret Import")).toBe(false);
    const hiddenDetail = await app.request(`/v1/jobs/${imported!.id}`, { headers: { Cookie: b.cookie } });
    expect(hiddenDetail.status).toBe(404);
    const ownDetail = await app.request(`/v1/jobs/${imported!.id}`, { headers: { Cookie: a.cookie } });
    expect(ownDetail.status).toBe(200);

    const profileB = (await (await app.request("/v1/profile", { headers: { Cookie: b.cookie } })).json()) as {
      user: { id: string };
    };
    const skillJob = toUserImportedJob(
      {
        applyUrl: `https://jobs.lever.co/example/skill-${randomUUID()}`,
        title: "Skill Isolation",
        companyName: "Example",
        descriptionText: "Preferred: TypeScript",
      },
      new Date(),
      { userId: profileB.user.id },
    );
    skillJob.preferredSkills = ["TypeScript"];
    await upsertCanonicalJobs(db, [skillJob]);
    const skillA = await app.request("/v1/jobs?skill=TypeScript", { headers: { Cookie: a.cookie } });
    const skillB = await app.request("/v1/jobs?skill=TypeScript", { headers: { Cookie: b.cookie } });
    const skillBodyA = (await skillA.json()) as { results: Array<{ title: string; listingKind: string }> };
    const skillBodyB = (await skillB.json()) as { results: Array<{ title: string; listingKind: string }> };
    expect(skillBodyA.results.some((row) => row.title === "Skill Isolation")).toBe(false);
    expect(skillBodyB.results.some((row) => row.title === "Skill Isolation" && row.listingKind === "user_import")).toBe(
      true,
    );

    const naukri = await app.request("/v1/jobs/import", {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        applyUrl: "https://www.naukri.com/job-listings-analyst-example",
        title: "Analyst",
        companyName: "Example",
        descriptionText: "Pasted manually.",
      }),
    });
    expect(naukri.status).toBe(200);

    const badImport = await app.request("/v1/jobs/import", {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        applyUrl: "http://127.0.0.1/latest/meta-data",
        title: "Nope",
        companyName: "Nope",
      }),
    });
    expect(badImport.status).toBe(400);
  });

  it("does not merge user imports across users or onto live board jobs", { timeout: 60_000 }, async () => {
    const app = createApp();
    const a = await signUp(app, `jobs-merge-a-${randomUUID()}@example.com`);
    const b = await signUp(app, `jobs-merge-b-${randomUUID()}@example.com`);
    const db = await getDb();
    const profileA = (await (await app.request("/v1/profile", { headers: { Cookie: a.cookie } })).json()) as {
      user: { id: string };
    };
    const profileB = (await (await app.request("/v1/profile", { headers: { Cookie: b.cookie } })).json()) as {
      user: { id: string };
    };
    const applyUrl = `https://jobs.lever.co/example/merge-${randomUUID()}`;
    await upsertCanonicalJobs(db, [
      toUserImportedJob(
        { applyUrl, title: "Merge Probe", companyName: "Example", descriptionText: "A notes", notes: "private-a" },
        new Date(),
        { userId: profileA.user.id },
      ),
    ]);
    await upsertCanonicalJobs(db, [
      toUserImportedJob(
        { applyUrl, title: "Merge Probe", companyName: "Example", descriptionText: "B notes", notes: "private-b" },
        new Date(),
        { userId: profileB.user.id },
      ),
    ]);
    const live: CanonicalJob = {
      source: "greenhouse",
      externalId: `live-${randomUUID()}`,
      boardId: "example",
      title: "Merge Probe",
      companyName: "Example",
      applyUrl,
      descriptionText: "Board copy",
      workplaceType: "unknown",
      employmentType: "full_time",
      locations: [],
      firstSeen: new Date().toISOString(),
      lastVerified: new Date().toISOString(),
      status: "open",
      listingKind: "live",
    };
    const ignored = await upsertCanonicalJobs(db, [
      { ...live, applyUrl: "javascript:alert(1)", externalId: `bad-${randomUUID()}` },
    ]);
    expect(ignored.ignored).toBeGreaterThanOrEqual(1);
    await upsertCanonicalJobs(db, [live]);
    const rows = await db.query.job.findMany({
      where: eq(job.canonicalUrl, canonicalUrl(applyUrl) ?? applyUrl),
    });
    const imports = rows.filter((row) => row.listingKind === "user_import");
    const liveRows = rows.filter((row) => row.listingKind === "live");
    expect(imports).toHaveLength(2);
    expect(imports.map((row) => row.importedByUserId).sort()).toEqual([profileA.user.id, profileB.user.id].sort());
    expect(imports.every((row) => row.importNotes?.startsWith("private-"))).toBe(true);
    expect(liveRows).toHaveLength(1);
    expect(liveRows[0]?.importedByUserId).toBeNull();
    expect(liveRows[0]?.importNotes).toBeNull();
  });

  it("rejects ingest admin for an unverified ADMIN_EMAILS signup", { timeout: 60_000 }, async () => {
    const email = `jobs-admin-${randomUUID()}@example.com`;
    const previousEmails = process.env.ADMIN_EMAILS;
    const previousIds = process.env.ADMIN_USER_IDS;
    process.env.ADMIN_EMAILS = email;
    process.env.ADMIN_USER_IDS = "";
    try {
      const app = createApp();
      const signed = await signUp(app, email);
      const unverified = await app.request("/v1/admin/jobs/ingest", {
        method: "POST",
        headers: { Cookie: signed.cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ fixtures: true }),
      });
      expect(unverified.status).toBe(403);
      const db = await getDb();
      const profileRes = await app.request("/v1/profile", { headers: { Cookie: signed.cookie } });
      const profileBody = (await profileRes.json()) as { user: { id: string } };
      await db.update(user).set({ emailVerified: true }).where(eq(user.id, profileBody.user.id));
      const verified = await app.request("/v1/admin/jobs/ingest", {
        method: "POST",
        headers: { Cookie: signed.cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ fixtures: true }),
      });
      expect(verified.status).toBe(200);
    } finally {
      process.env.ADMIN_EMAILS = previousEmails;
      process.env.ADMIN_USER_IDS = previousIds;
    }
  });
});
