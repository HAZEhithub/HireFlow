import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("apply and pack never POST to employer URLs", () => {
  it("uses GET anchors for apply links in the app", () => {
    const jobDetail = read("apps/web/app/(app)/jobs/[id]/page.tsx");
    expect(jobDetail).toMatch(/<a href=\{row\.applyUrl\} target="_blank"/);
    expect(jobDetail).not.toMatch(/fetch\(row\.applyUrl/);
    expect(jobDetail).not.toMatch(/method:\s*"POST"/);

    const application = read("apps/web/app/(app)/applications/[id]/page.tsx");
    expect(application).toMatch(/<a href=\{row\.applyUrl/);
    expect(application).not.toMatch(/fetch\(row\.applyUrl/);
  });

  it("keeps the extension on activeTab with empty host permissions", () => {
    const config = read("apps/extension/wxt.config.ts");
    expect(config).toContain('permissions: ["storage", "activeTab"]');
    expect(config).toContain("host_permissions: []");
    const popup = read("apps/extension/entrypoints/popup.ts");
    expect(popup).not.toMatch(/fetch\(/);
    expect(popup).not.toMatch(/method:\s*"POST"/);
  });

  it("documents that packs only assemble paste, never submit", () => {
    const pack = read("packages/applications/src/pack.ts");
    expect(pack).toContain("will not submit applications");
    expect(pack).toContain("aiDrafts: false");
  });
});
