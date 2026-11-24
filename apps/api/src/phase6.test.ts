import "./test-env";

import { randomUUID } from "node:crypto";
import { completeAiTask, phrasingSuggestionSchema } from "@hireflow/ai";
import { getDb, getUsagePeriodCount, tryIncrementUsagePeriod } from "@hireflow/db";
import { ingestJobs } from "@hireflow/jobs";
import { emptyStructuredResume } from "@hireflow/shared";
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
    body: JSON.stringify({ email, password: "password1", name: "Phase Six" }),
  });
  const body = (await res.json()) as { user?: { id: string } };
  return { res, cookie: cookiesFrom(res), userId: body.user?.id };
}

describe("Phase 6 surfaces", () => {
  it("isolates evidence-map, brief, and analytics and meters AI assists once", { timeout: 180_000 }, async () => {
    const db = await getDb();
    await ingestJobs(db, { fixtures: true });
    const app = createApp();
    const a = await signUp(app, `p6-a-${randomUUID()}@example.com`);
    const b = await signUp(app, `p6-b-${randomUUID()}@example.com`);
    expect(a.res.status).toBe(200);
    expect(a.userId).toBeTruthy();

    const jobs = await app.request("/v1/jobs?pageSize=1", { headers: { Cookie: a.cookie } });
    const jobsBody = (await jobs.json()) as { results: Array<{ id: string }> };
    const jobId = jobsBody.results[0]?.id as string;

    const created = await app.request("/v1/resumes", {
      method: "POST",
      headers: { Origin: origin, Cookie: a.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Master" }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as { resume: { id: string } };
    const content = emptyStructuredResume();
    content.personal.fullName = "Asha";
    content.personal.headline = "Engineer";
    content.skills = [{ id: "s1", category: "", items: ["TypeScript"] }];
    const patched = await app.request(`/v1/resumes/${createdBody.resume.id}`, {
      method: "PATCH",
      headers: { Origin: origin, Cookie: a.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    expect(patched.status).toBe(200);
    const resumeBody = (await patched.json()) as { resume: { id: string; currentVersionId: string | null } };
    const versionId = resumeBody.resume.currentVersionId;

    const map = await app.request(`/v1/jobs/${jobId}/evidence-map?resumeVersionId=${versionId}`, {
      headers: { Cookie: a.cookie },
    });
    expect(map.status).toBe(200);
    const mapBody = (await map.json()) as { complimentaryPreview: boolean; disclaimer: string };
    expect(mapBody.complimentaryPreview).toBe(true);
    expect(mapBody.disclaimer.toLowerCase()).toContain("not a probability");

    const stolenMap = await app.request(`/v1/jobs/${jobId}/evidence-map?resumeVersionId=${versionId}`, {
      headers: { Cookie: b.cookie },
    });
    expect(stolenMap.status).toBe(404);

    const missing = await app.request("/v1/jobs/not-real/evidence-map", { headers: { Cookie: a.cookie } });
    expect(missing.status).toBe(404);

    const brief = await app.request(`/v1/jobs/${jobId}/brief`, { headers: { Cookie: a.cookie } });
    expect(brief.status).toBe(200);
    const briefBody = (await brief.json()) as { sourceOnly: boolean; interviewCopilot: boolean; job: { source: string } };
    expect(briefBody.sourceOnly).toBe(true);
    expect(briefBody.interviewCopilot).toBe(false);
    expect(briefBody.job.source).toBeTruthy();

    const stolenBrief = await app.request("/v1/jobs/not-real/brief", { headers: { Cookie: b.cookie } });
    expect(stolenBrief.status).toBe(404);

    await app.request("/v1/applications", {
      method: "POST",
      headers: { Cookie: a.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ companyName: "Acme", title: "Intern", stage: "applied" }),
    });
    const analyticsA = await app.request("/v1/applications/analytics", { headers: { Cookie: a.cookie } });
    expect(analyticsA.status).toBe(200);
    const analyticsABody = (await analyticsA.json()) as {
      total: number;
      medianDaysInStage: Array<{ caveat: string | null }>;
    };
    expect(analyticsABody.total).toBeGreaterThanOrEqual(1);
    expect(analyticsABody.medianDaysInStage.every((row) => row.caveat === "too few rows")).toBe(true);

    const analyticsB = await app.request("/v1/applications/analytics", { headers: { Cookie: b.cookie } });
    const analyticsBBody = (await analyticsB.json()) as { total: number };
    expect(analyticsBBody.total).toBe(0);

    let probed = false;
    let completed = false;
    const denied = await completeAiTask({
      db,
      userId: a.userId as string,
      feature: "resume.phrasing",
      payloadClass: "sensitive",
      needsLlm: true,
      prompt: "do not log this resume body",
      schema: phrasingSuggestionSchema,
      consent: { aiExternalConsent: false, aiPaidConsent: false },
      probeOllama: async () => {
        probed = true;
        return true;
      },
      completeOllama: async () => {
        completed = true;
        return '{"suggestions":[]}';
      },
    });
    expect(denied.status).toBe("denied_consent");
    expect(probed).toBe(false);
    expect(completed).toBe(false);

    const failed = await completeAiTask({
      db,
      userId: a.userId as string,
      feature: "resume.phrasing",
      payloadClass: "sensitive",
      needsLlm: true,
      prompt: "resume",
      schema: phrasingSuggestionSchema,
      consent: { aiExternalConsent: true, aiPaidConsent: false },
      probeOllama: async () => true,
      completeOllama: async () => {
        throw new Error("ollama_unavailable");
      },
    });
    expect(failed.status).toBe("provider_unavailable");
    expect(await getUsagePeriodCount(db, a.userId as string, "ai.assists_per_month")).toBe(0);

    const ok = await completeAiTask({
      db,
      userId: a.userId as string,
      feature: "resume.phrasing",
      payloadClass: "sensitive",
      needsLlm: true,
      prompt: "resume",
      schema: phrasingSuggestionSchema,
      consent: { aiExternalConsent: true, aiPaidConsent: false },
      probeOllama: async () => true,
      completeOllama: async () => '{"suggestions":[]}',
    });
    expect(ok.status).toBe("success");
    expect(await getUsagePeriodCount(db, a.userId as string, "ai.assists_per_month")).toBe(1);

    const usage = await app.request("/v1/usage", { headers: { Cookie: a.cookie } });
    const usageBody = (await usage.json()) as { aiAssistsUsed: number };
    expect(usageBody.aiAssistsUsed).toBe(1);
  });

  it("allows only one concurrent monthly increment to succeed", { timeout: 60_000 }, async () => {
    const app = createApp();
    const signed = await signUp(app, `p6-quota-${randomUUID()}@example.com`);
    const db = await getDb();
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        tryIncrementUsagePeriod(db, signed.userId as string, "ai.assists_per_month", 1),
      ),
    );
    expect(results.filter((row) => row.ok)).toHaveLength(1);
    expect(results.filter((row) => !row.ok)).toHaveLength(5);
  });
});
