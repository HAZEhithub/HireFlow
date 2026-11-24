import { describe, expect, it } from "vitest";
import {
  assertPermittedCollection,
  assertSafePublicHttpUrl,
  fetchPublicPageTitle,
  persistableApplyUrl,
  UnsafeUrlError,
} from "./ssrf";

describe("import URL safety", () => {
  it("blocks forbidden collection hosts", () => {
    expect(() => assertPermittedCollection("https://www.linkedin.com/jobs/view/1")).toThrow(/not permitted/);
    expect(() => assertPermittedCollection("https://www.naukri.com/job")).toThrow(/not permitted/);
    expect(() => assertPermittedCollection("https://www.indeed.com/viewjob")).toThrow(/not permitted/);
    expect(() => assertPermittedCollection("https://in.indeed.com/viewjob")).toThrow(/not permitted/);
    expect(() => assertPermittedCollection("https://www.indeed.co.in/viewjob")).toThrow(/not permitted/);
    expect(() => assertPermittedCollection("https://lnkd.in/abc")).toThrow(/not permitted/);
    expect(() => assertPermittedCollection("https://acme.myworkdayjobs.com/en-US/job")).toThrow(/not permitted/);
  });

  it("blocks localhost, private IPs, metadata, and credentials", () => {
    expect(() => assertSafePublicHttpUrl("http://127.0.0.1/")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("http://localhost:8080/")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("http://192.168.1.9/")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("http://169.254.169.254/latest/meta-data")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("http://10.0.0.4/")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("http://user:pass@example.com/")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("ftp://example.com/")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("not-a-url")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("http://2130706433/")).toThrow(UnsafeUrlError);
    expect(() => assertSafePublicHttpUrl("http://127.1/")).toThrow(UnsafeUrlError);
    expect(persistableApplyUrl("javascript:alert(1)")).toBeUndefined();
    expect(persistableApplyUrl("data:text/html,hi")).toBeUndefined();
    expect(persistableApplyUrl("https://boards.greenhouse.io/acme/jobs/1")?.protocol).toBe("https:");
  });

  it("blocks unsafe redirects and hosts outside the allowlist", async () => {
    const blocked = await fetchPublicPageTitle("https://example.com/job");
    expect(blocked.error).toMatch(/limited to Greenhouse/);
    const redirect = await fetchPublicPageTitle("https://jobs.lever.co/acme/1", {
      fetch: async () =>
        new Response(null, {
          status: 302,
          headers: { location: "http://127.0.0.1/secret" },
        }),
    });
    expect(redirect.error).toMatch(/unsafe redirect/i);
    const linkedin = await fetchPublicPageTitle("https://www.linkedin.com/jobs/view/1");
    expect(linkedin.error).toMatch(/not permitted/);
  });
});
