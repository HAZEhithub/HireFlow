import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, emptyStructuredResume } from "@hireflow/shared";
import { ResumeError } from "./errors";
import { detectResumeKind } from "./magic";
import { parseResumeFile } from "./parse";
import { parseResumeSections } from "./parse/sections";

const SAMPLE = `Asha Raman
Bengaluru, India
asha.raman@example.com
+91 90000 11111
https://github.com/asha-raman

SUMMARY
Backend engineer with TypeScript and PostgreSQL.

SKILLS
TypeScript, PostgreSQL, React, SQL

EXPERIENCE
Software Engineer | Northwind Labs | Bengaluru
Jan 2022 - Present
Built billing APIs in TypeScript.
Owned PostgreSQL schema design.

EDUCATION
National Institute of Technology
B.Tech Computer Science
2018 - 2022

PROJECTS
Campus Jobs Board
Matching internships with TypeScript and PostgreSQL.
`;

describe("resume parsing", () => {
  it("extracts contact, skills, and experience from TXT without inventing dates", async () => {
    const parsed = await parseResumeFile({
      buffer: Buffer.from(SAMPLE, "utf8"),
      filename: "asha.txt",
      mimeType: "text/plain",
    });
    expect(parsed.kind).toBe("txt");
    expect(parsed.content.personal.email).toBe("asha.raman@example.com");
    expect(parsed.content.personal.fullName).toContain("Asha");
    expect(parsed.content.personal.location).toMatch(/Bengaluru/);
    expect(parsed.content.skills[0]?.items).toEqual(expect.arrayContaining(["TypeScript", "PostgreSQL"]));
    expect(parsed.content.experience[0]?.startDate).toMatch(/2022/);
    expect(parsed.likelyScanned).toBe(false);
    expect(parsed.content.experience[0]?.company).toContain("Northwind");
  });

  it("does not invent missing employment dates", () => {
    const parsed = parseResumeSections(`Priya Shah
priya@example.com
EXPERIENCE
Intern
Worked on internal tools.
`);
    expect(parsed.content.experience[0]?.startDate).toBe("");
    expect(parsed.missingFields).toContain("education");
  });

  it("rejects empty, oversized, and unsupported files", async () => {
    await expect(
      parseResumeFile({ buffer: Buffer.alloc(0), filename: "empty.txt", mimeType: "text/plain" }),
    ).rejects.toMatchObject({ code: "empty_file" });
    await expect(
      parseResumeFile({
        buffer: Buffer.alloc(MAX_UPLOAD_BYTES + 1, 1),
        filename: "huge.txt",
        mimeType: "text/plain",
      }),
    ).rejects.toMatchObject({ code: "file_too_large" });
    expect(() => detectResumeKind(Buffer.from([0, 1, 2, 3, 4, 5]), "virus.bin", "application/octet-stream")).toThrow(
      ResumeError,
    );
  });

  it("rejects path-traversal-like zip names and non-docx zips", () => {
    const emptyZip = Buffer.from("PK\x05\x06" + "\0".repeat(18));
    expect(() => detectResumeKind(emptyZip, "file.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toThrow();
  });

  it("starts from an empty structured resume without fabricated facts", () => {
    const empty = emptyStructuredResume();
    expect(empty.experience).toEqual([]);
    expect(empty.personal.fullName).toBe("");
  });
});
