import "./test-env";

import { randomUUID } from "node:crypto";
import { resetRateLimits } from "@hireflow/config";
import { completenessFrom, getDb, notification } from "@hireflow/db";
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

function authHeaders(cookie?: string, extra?: HeadersInit): HeadersInit {
  return {
    Origin: origin,
    Referer: `${origin}/sign-up`,
    "Content-Type": "application/json",
    ...(cookie ? { Cookie: cookie } : {}),
    ...extra,
  };
}

async function signUp(app: ReturnType<typeof createApp>, email: string, name = "Test User") {
  const res = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: authHeaders(undefined, { "x-forwarded-for": "auth-flow" }),
    body: JSON.stringify({ email, password: "password1", name }),
  });
  const body = (await res.json()) as { user?: { id: string; email: string }; message?: string };
  return { res, body, cookie: cookiesFrom(res) };
}

describe("HireFlow API", () => {
  it("exposes health without auth", async () => {
    const app = createApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.billingLive).toBe(false);
  });

  it("rejects unauthenticated protected routes", { timeout: 180_000 }, async () => {
    const app = createApp();
    const paths = [
      ["/v1/profile", "GET"],
      ["/v1/settings", "GET"],
      ["/v1/notifications", "GET"],
      ["/v1/notifications/not-a-real-id/read", "POST"],
      ["/v1/notifications/read-all", "POST"],
      ["/v1/usage", "GET"],
      ["/v1/entitlements", "GET"],
      ["/v1/export", "GET"],
      ["/v1/account", "DELETE"],
      ["/v1/jobs", "GET"],
      ["/v1/jobs/filters", "GET"],
      ["/v1/jobs/saved", "GET"],
      ["/v1/jobs/import", "POST"],
      ["/v1/admin/jobs/ingest", "POST"],
      ["/v1/resumes", "GET"],
      ["/v1/resumes", "POST"],
      ["/v1/applications", "GET"],
      ["/v1/applications", "POST"],
      ["/v1/applications/analytics", "GET"],
      ["/v1/evidence", "GET"],
      ["/v1/evidence", "POST"],
      ["/v1/jobs/not-a-job/evidence-map", "GET"],
      ["/v1/jobs/not-a-job/brief", "GET"],
    ] as const;
    for (const [path, method] of paths) {
      const res = await app.request(path, { method });
      expect(res.status, path).toBe(401);
    }
  });
});

describe("profile completeness", () => {
  it("scores empty profiles at 0 and filled ones at 100", () => {
    expect(
      completenessFrom({
        headline: null,
        summary: null,
        location: null,
        desiredTitles: [],
        workplacePreference: "any",
        status: null,
        employmentTypes: [],
        skills: [],
        education: [],
        experience: [],
      }),
    ).toBe(0);
    expect(
      completenessFrom({
        headline: "Engineer",
        summary: "Builds products",
        location: "Bengaluru",
        desiredTitles: ["Software Engineer"],
        workplacePreference: "hybrid",
        status: "entry",
        employmentTypes: ["full_time"],
        skills: ["TypeScript"],
        education: [{ label: "B.Tech" }],
        experience: [],
      }),
    ).toBe(100);
  });
});

describe("authenticated workspace", { timeout: 60_000 }, () => {
  it("registers, isolates data, and enforces session ownership", async () => {
    resetRateLimits();
    const app = createApp();
    const emailA = `a-${randomUUID()}@example.test`;
    const emailB = `b-${randomUUID()}@example.test`;

    const a = await signUp(app, emailA, "Ada");
    expect(a.res.status).toBe(200);
    expect(a.body.user?.email).toBe(emailA);
    expect(a.cookie).toMatch(/better-auth\.session_token/);
    const setCookie = (
      typeof a.res.headers.getSetCookie === "function" ? a.res.headers.getSetCookie() : []
    )
      .join(";")
      .toLowerCase();
    expect(setCookie).toMatch(/httponly/);
    expect(setCookie).toMatch(/samesite=lax/);

    const sessionRes = await app.request("/api/auth/get-session", {
      headers: authHeaders(a.cookie, { "x-forwarded-for": "auth-flow" }),
    });
    expect(sessionRes.status).toBe(200);
    const session = (await sessionRes.json()) as { user?: { id: string; email: string } };
    expect(session.user?.id).toBe(a.body.user?.id);

    const profileRes = await app.request("/v1/profile", { headers: authHeaders(a.cookie) });
    expect(profileRes.status).toBe(200);
    const profileBody = (await profileRes.json()) as {
      profile: { completeness: number } | null;
      user: { email: string };
    };
    expect(profileBody.user.email).toBe(emailA);
    expect(profileBody.profile).toBeTruthy();

    const invalid = await app.request("/v1/profile", {
      method: "PATCH",
      headers: authHeaders(a.cookie),
      body: JSON.stringify({ employmentTypes: ["not-a-type"] }),
    });
    expect(invalid.status).toBe(400);
    const malformed = await app.request("/v1/profile", {
      method: "PATCH",
      headers: authHeaders(a.cookie),
      body: "{",
    });
    expect(malformed.status).toBe(400);

    const patched = await app.request("/v1/profile", {
      method: "PATCH",
      headers: authHeaders(a.cookie),
      body: JSON.stringify({
        headline: "Product engineer",
        location: "Pune",
        desiredTitles: ["Software Engineer"],
        workplacePreference: "remote",
        skills: ["TypeScript"],
      }),
    });
    expect(patched.status).toBe(200);
    const patchedBody = (await patched.json()) as { ok: boolean; completeness: number };
    expect(patchedBody.ok).toBe(true);
    expect(patchedBody.completeness).toBeGreaterThan(0);

    const emptyInbox = await app.request("/v1/notifications", { headers: authHeaders(a.cookie) });
    expect(emptyInbox.status).toBe(200);
    const emptyBody = (await emptyInbox.json()) as { notifications: unknown[]; unreadCount: number };
    expect(emptyBody.notifications).toEqual([]);
    expect(emptyBody.unreadCount).toBe(0);

    const noteId = randomUUID();
    const db = await getDb();
    await db.insert(notification).values({
      id: noteId,
      userId: a.body.user!.id,
      type: "system",
      title: "Welcome",
      body: "Your inbox is working.",
    });

    const listed = await app.request("/v1/notifications", { headers: authHeaders(a.cookie) });
    const listedBody = (await listed.json()) as { unreadCount: number; notifications: { id: string }[] };
    expect(listedBody.unreadCount).toBe(1);
    expect(listedBody.notifications[0]?.id).toBe(noteId);

    const b = await signUp(app, emailB, "Ben");
    expect(b.res.status).toBe(200);
    const stolen = await app.request(`/v1/notifications/${noteId}/read`, {
      method: "POST",
      headers: authHeaders(b.cookie),
    });
    expect(stolen.status).toBe(404);

    const bInbox = await app.request("/v1/notifications", { headers: authHeaders(b.cookie) });
    const bInboxBody = (await bInbox.json()) as { unreadCount: number };
    expect(bInboxBody.unreadCount).toBe(0);

    const marked = await app.request(`/v1/notifications/${noteId}/read`, {
      method: "POST",
      headers: authHeaders(a.cookie),
    });
    expect(marked.status).toBe(200);

    const afterRead = await app.request("/v1/notifications", { headers: authHeaders(a.cookie) });
    const afterReadBody = (await afterRead.json()) as { unreadCount: number };
    expect(afterReadBody.unreadCount).toBe(0);

    const usage = await app.request("/v1/usage", { headers: authHeaders(a.cookie) });
    expect(usage.status).toBe(200);
    const usageBody = (await usage.json()) as {
      requestEvents: number;
      entitlements: { billingLive: boolean };
    };
    expect(usageBody.requestEvents).toBeGreaterThanOrEqual(0);
    expect(usageBody.entitlements.billingLive).toBe(false);

    const entitlements = await app.request("/v1/entitlements", { headers: authHeaders(a.cookie) });
    const entBody = (await entitlements.json()) as {
      billingLive: boolean;
      plans: { pro: { checkoutEnabled: boolean; priceInrExGst: number } };
    };
    expect(entBody.billingLive).toBe(false);
    expect(entBody.plans.pro.checkoutEnabled).toBe(false);
    expect(entBody.plans.pro.priceInrExGst).toBe(199);

    const exported = await app.request("/v1/export", { headers: authHeaders(a.cookie) });
    expect(exported.status).toBe(200);
    const exportBody = (await exported.json()) as { user: { email: string } };
    expect(exportBody.user.email).toBe(emailA);

    const signOut = await app.request("/api/auth/sign-out", {
      method: "POST",
      headers: authHeaders(a.cookie, { "x-forwarded-for": "auth-flow" }),
      body: JSON.stringify({}),
    });
    expect(signOut.status).toBe(200);
    const afterSignOut = await app.request("/v1/profile", { headers: authHeaders(a.cookie) });
    expect(afterSignOut.status).toBe(401);

    const signedIn = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: authHeaders(undefined, { "x-forwarded-for": "auth-flow" }),
      body: JSON.stringify({ email: emailA, password: "password1" }),
    });
    expect(signedIn.status).toBe(200);
    const signedInCookie = cookiesFrom(signedIn);

    const deleted = await app.request("/v1/account", {
      method: "DELETE",
      headers: authHeaders(signedInCookie),
    });
    expect(deleted.status).toBe(200);
    const gone = await app.request("/v1/profile", { headers: authHeaders(signedInCookie) });
    expect(gone.status).toBe(401);
  });

  it("rate-limits auth endpoints and ignores spoofed forwarding headers", async () => {
    resetRateLimits();
    const app = createApp();
    let last = 200;
    for (let i = 0; i < 31; i++) {
      const res = await app.request("/api/auth/ok", {
        headers: { "x-forwarded-for": "rate-limit-probe" },
      });
      last = res.status;
    }
    expect(last).toBe(429);
    const spoofed = await app.request("/api/auth/ok", {
      headers: { "x-forwarded-for": "198.51.100.1" },
    });
    expect(spoofed.status).toBe(429);
  });
});
