import "./test-env";

import { randomUUID } from "node:crypto";
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
    body: JSON.stringify({ email, password: "password1", name: "Seeker" }),
  });
  return { res, cookie: cookiesFrom(res) };
}

describe("applications API", () => {
  it("isolates applications, records stage events, follow-ups, evidence, and pack paste", { timeout: 180_000 }, async () => {
    const app = createApp();
    const a = await signUp(app, `app-a-${randomUUID()}@example.com`);
    const b = await signUp(app, `app-b-${randomUUID()}@example.com`);
    expect(a.res.status).toBe(200);

    const created = await app.request("/v1/applications", {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ companyName: "Acme", title: "Intern", stage: "saved" }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as { application: { id: string; stage: string } };
    const id = createdBody.application.id;

    const moved = await app.request(`/v1/applications/${id}`, {
      method: "PATCH",
      headers: { Cookie: a.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ stage: "applied" }),
    });
    expect(moved.status).toBe(200);
    const movedBody = (await moved.json()) as { events: Array<{ toStage: string }> };
    expect(movedBody.events.some((event) => event.toStage === "applied")).toBe(true);

    const follow = await app.request(`/v1/applications/${id}/follow-ups`, {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ dueAt: new Date(Date.now() + 86_400_000).toISOString(), title: "Check inbox" }),
    });
    expect(follow.status).toBe(201);

    const inbox = await app.request("/v1/notifications", { headers: { Cookie: a.cookie } });
    const inboxBody = (await inbox.json()) as { notifications: Array<{ type: string }> };
    expect(inboxBody.notifications.some((row) => row.type === "follow_up")).toBe(true);

    const pack = await app.request(`/v1/applications/${id}/pack`, {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ slot: "cover_letter", body: "I wrote this letter." }),
    });
    expect(pack.status).toBe(200);

    const evidence = await app.request("/v1/evidence", {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ kind: "project", title: "Campus project" }),
    });
    expect(evidence.status).toBe(201);

    const other = await app.request(`/v1/applications/${id}`, { headers: { Cookie: b.cookie } });
    expect(other.status).toBe(404);

    const otherPatch = await app.request(`/v1/applications/${id}`, {
      method: "PATCH",
      headers: { Cookie: b.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ stage: "offer" }),
    });
    expect(otherPatch.status).toBe(404);

    const exported = await app.request("/v1/export", { headers: { Cookie: a.cookie } });
    const exportBody = (await exported.json()) as {
      applications: Array<{ id: string }>;
      evidence: Array<{ title: string }>;
      applicationPackItems: Array<{ slot: string }>;
    };
    expect(exportBody.applications.some((row) => row.id === id)).toBe(true);
    expect(exportBody.evidence.some((row) => row.title === "Campus project")).toBe(true);
    expect(exportBody.applicationPackItems.some((row) => row.slot === "cover_letter")).toBe(true);
  });
});
