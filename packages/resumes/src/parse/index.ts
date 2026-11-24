import { MAX_UPLOAD_BYTES } from "@hireflow/shared";
import { ResumeError } from "../errors";
import { extractResumeText } from "./extract";
import { parseResumeSections, type ResumeParseResult } from "./sections";

export { parseResumeSections } from "./sections";
export type { ResumeParseResult } from "./sections";

export type ParsePipelineResult = ResumeParseResult & {
  kind: "pdf" | "docx" | "txt";
  pageCount: number | null;
  extractedChars: number;
};

export async function parseResumeFile(input: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<ParsePipelineResult> {
  if (!input.buffer.length) {
    throw new ResumeError("empty_file", "The uploaded file is empty.", 400);
  }
  if (input.buffer.length > MAX_UPLOAD_BYTES) {
    throw new ResumeError("file_too_large", "Resumes must be 5 MB or smaller.", 413);
  }
  const extracted = await extractResumeText(input.buffer, input.filename, input.mimeType);
  const parsed = parseResumeSections(extracted.text, extracted.warnings);
  parsed.likelyScanned = extracted.likelyScanned;
  if (extracted.likelyScanned) {
    parsed.missingFields = ["name", "email", "phone", "location", "summary", "skills", "experience", "education"];
  }
  return {
    ...parsed,
    kind: extracted.kind,
    pageCount: extracted.pageCount,
    extractedChars: extracted.text.length,
  };
}
