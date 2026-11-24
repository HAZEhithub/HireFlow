import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { ResumeError } from "../errors";
import { detectResumeKind, type ResumeFileKind } from "../magic";

const MAX_PAGES = 12;
const MAX_TEXT_CHARS = 80_000;
const SCANNED_TEXT_THRESHOLD = 80;

export type ExtractedDocument = {
  kind: ResumeFileKind;
  text: string;
  pageCount: number | null;
  likelyScanned: boolean;
  warnings: string[];
};

function decodeTxt(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString("utf16le");
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.alloc(buffer.length - 2);
    for (let i = 2; i + 1 < buffer.length; i += 2) {
      swapped[i - 2] = buffer[i + 1] ?? 0;
      swapped[i - 1] = buffer[i] ?? 0;
    }
    return swapped.toString("utf16le");
  }
  return buffer.toString("utf8");
}

async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer), { maxImageSize: 4_000_000 });
    const pageCount = pdf.numPages;
    if (pageCount > MAX_PAGES) {
      throw new ResumeError("too_many_pages", `Resumes are limited to ${MAX_PAGES} pages.`, 413);
    }
    const { text } = await extractText(pdf, { mergePages: true });
    try {
      await pdf.loadingTask.destroy();
    } catch {
      /* ignore */
    }
    const cleaned = text.replace(/\u0000/g, "").slice(0, MAX_TEXT_CHARS);
    const letters = cleaned.replace(/\s+/g, "").length;
    const likelyScanned = pageCount > 0 && letters < SCANNED_TEXT_THRESHOLD;
    const warnings: string[] = [];
    if (likelyScanned) {
      warnings.push(
        "This PDF has almost no extractable text. It is likely a scanned image. Optical character recognition is not enabled, so HireFlow cannot parse it. Upload a text-based PDF, DOCX, or TXT instead.",
      );
    }
    if (!cleaned.trim() && !likelyScanned) {
      warnings.push("No text could be extracted from this PDF.");
    }
    return { kind: "pdf", text: cleaned, pageCount, likelyScanned, warnings };
  } catch (error) {
    if (error instanceof ResumeError) throw error;
    throw new ResumeError("pdf_parse_failed", "This PDF could not be read. It may be damaged, encrypted, or image-only.", 422);
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = String(result.value ?? "").slice(0, MAX_TEXT_CHARS);
    const warnings = result.messages
      .filter((message) => message.type === "error")
      .map((message) => message.message)
      .slice(0, 8);
    if (!text.trim()) warnings.push("No text could be extracted from this Word document.");
    return { kind: "docx", text, pageCount: null, likelyScanned: false, warnings };
  } catch (error) {
    if (error instanceof ResumeError) throw error;
    throw new ResumeError("docx_parse_failed", "This Word document could not be read.", 422);
  }
}

export async function extractResumeText(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<ExtractedDocument> {
  const kind = detectResumeKind(buffer, filename, mimeType);
  if (kind === "pdf") return extractPdf(buffer);
  if (kind === "docx") return extractDocx(buffer);
  const text = decodeTxt(buffer).replace(/\u0000/g, "").slice(0, MAX_TEXT_CHARS);
  const warnings: string[] = [];
  if (!text.trim()) warnings.push("The text file is empty.");
  return { kind: "txt", text, pageCount: null, likelyScanned: false, warnings };
}
