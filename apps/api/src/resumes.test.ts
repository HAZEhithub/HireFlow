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
      "x-forwarded-for": email,
    },
    body: JSON.stringify({ email, password: "password1", name: "Resume User" }),
  });
  return { res, cookie: cookiesFrom(res) };
}

const sampleTxt = `Asha Raman
asha.raman@example.com
SKILLS
TypeScript, PostgreSQL
EXPERIENCE
Software Engineer | Northwind Labs
Jan 2022 - Present
Built billing APIs in TypeScript.
`;

describe("resume API", () => {
  it("isolates resumes across users and parses TXT", { timeout: 180_000 }, async () => {
    const app = createApp();
    const a = await signUp(app, `resume-a-${randomUUID()}@example.com`);
    const b = await signUp(app, `resume-b-${randomUUID()}@example.com`);
    expect(a.res.status).toBe(200);

    const created = await app.request("/v1/resumes", {
      method: "POST",
      headers: { Origin: origin, Cookie: a.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Master" }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as { resume: { id: string } };

    const other = await app.request(`/v1/resumes/${createdBody.resume.id}`, {
      headers: { Origin: origin, Cookie: b.cookie },
    });
    expect(other.status).toBe(404);

    const form = new FormData();
    form.set("file", new File([sampleTxt], "asha.txt", { type: "text/plain" }));
    const parsed = await app.request("/v1/resumes/parse", {
      method: "POST",
      headers: { Origin: origin, Cookie: a.cookie },
      body: form,
    });
    expect(parsed.status).toBe(200);
    const parsedBody = (await parsed.json()) as { documentId: string; content: { personal: { email: string } } };
    expect(parsedBody.content.personal.email).toBe("asha.raman@example.com");

    const confirmed = await app.request("/v1/resumes/confirm", {
      method: "POST",
      headers: { Origin: origin, Cookie: a.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: parsedBody.documentId,
        title: "Asha Raman",
        content: parsedBody.content,
      }),
    });
    expect(confirmed.status).toBe(201);
  });
});
