import { describe, expect, it } from "vitest";
import { fetchAshbyBoard, mapAshbyJob } from "./adapters/ashby";
import { fetchGreenhouseBoard, mapGreenhouseJob } from "./adapters/greenhouse";
import { fetchLeverBoard, mapLeverJob } from "./adapters/lever";
import { FIXTURE_ASHBY_PAYLOAD, FIXTURE_GREENHOUSE_PAYLOAD, FIXTURE_LEVER_PAYLOAD } from "./fixtures";

const now = new Date("2026-11-21T00:00:00.000Z");

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("greenhouse adapter", () => {
  it("maps official list+content fields and drops incomplete rows", () => {
    const jobs = FIXTURE_GREENHOUSE_PAYLOAD.jobs
      .map((row) => mapGreenhouseJob(row, "hireflow-fixture-greenhouse", now, "HireFlow Fixture Labs", "fixture"))
      .filter(Boolean);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.title).toBe("Software Engineering Intern");
    expect(jobs[0]?.applyUrl).toContain("greenhouse.io");
    expect(jobs[0]?.country).toBe("IN");
    expect(jobs[0]?.requiredSkills).toContain("TypeScript");
    expect(jobs[0]?.publishedAt).toBeNull();
    expect(jobs[0]?.lastProviderUpdate).toBe("2026-10-01T09:00:00.000Z");
    expect(
      mapGreenhouseJob(
        { ...FIXTURE_GREENHOUSE_PAYLOAD.jobs[0], id: 9, absolute_url: "javascript:alert(1)" },
        "hireflow-fixture-greenhouse",
        now,
        "HireFlow Fixture Labs",
      ),
    ).toBeUndefined();
  });

  it("handles empty, malformed, rate limit, server error, and timeout", async () => {
    await expect(fetchGreenhouseBoard("acme", { fetch: async () => jsonResponse({ jobs: [] }) })).resolves.toMatchObject({
      ok: true,
      jobs: [],
    });
    await expect(fetchGreenhouseBoard("acme", { fetch: async () => jsonResponse({ nope: true }) })).resolves.toMatchObject({
      ok: false,
    });
    await expect(fetchGreenhouseBoard("acme", { fetch: async () => jsonResponse({}, 429) })).resolves.toMatchObject({
      ok: false,
      retryable: true,
      status: 429,
    });
    await expect(fetchGreenhouseBoard("acme", { fetch: async () => jsonResponse({}, 500) })).resolves.toMatchObject({
      ok: false,
      retryable: true,
    });
    await expect(
      fetchGreenhouseBoard("acme", {
        fetch: async () => {
          throw new DOMException("The operation was aborted.", "TimeoutError");
        },
      }),
    ).resolves.toMatchObject({ ok: false, retryable: true });
  });
});

describe("lever adapter", () => {
  it("maps posting fields including salary when present", () => {
    const job = mapLeverJob(FIXTURE_LEVER_PAYLOAD[0], "hireflow-fixture-lever", now, "HireFlow Fixture Labs", "fixture");
    expect(job?.employmentType).toBe("full_time");
    expect(job?.workplaceType).toBe("remote");
    expect(job?.salaryDisclosure).toBe("disclosed");
    expect(job?.salaryCurrency).toBe("INR");
  });

  it("paginates until a short page", async () => {
    let calls = 0;
    const result = await fetchLeverBoard("acme", {
      fetch: async () => {
        calls += 1;
        if (calls === 1) return jsonResponse(Array.from({ length: 100 }, (_, i) => ({ ...FIXTURE_LEVER_PAYLOAD[0], id: `p${i}` })));
        return jsonResponse([]);
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jobs.length).toBe(100);
    expect(calls).toBe(2);
  });
});

describe("ashby adapter", () => {
  it("skips unlisted jobs and maps compensation when published", () => {
    const jobs = FIXTURE_ASHBY_PAYLOAD.jobs
      .map((row) => mapAshbyJob(row, "hireflow-fixture-ashby", now, "HireFlow Fixture Labs", "fixture"))
      .filter(Boolean);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.workplaceType).toBe("hybrid");
    expect(jobs[0]?.salaryMin).toBe(1800000);
  });

  it("treats missing required fields as skipped rows, not a crash", async () => {
    const result = await fetchAshbyBoard("acme", {
      fetch: async () => jsonResponse({ jobs: [{ id: "x" }] }),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jobs).toEqual([]);
  });
});
