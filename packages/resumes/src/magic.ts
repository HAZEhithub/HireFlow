import { ResumeError } from "./errors";

export type ResumeFileKind = "pdf" | "docx" | "txt";

const MAX_ZIP_ENTRIES = 200;
const MAX_UNCOMPRESSED = 12 * 1024 * 1024;
const MAX_RATIO = 80;

function inspectZip(buf: Buffer): string[] {
  let eocd = -1;
  const min = Math.max(0, buf.length - 65_557);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ResumeError("invalid_docx", "The Word file is not a valid document archive.", 415);
  const disk = buf.readUInt16LE(eocd + 4);
  if (disk !== 0) throw new ResumeError("zip_bomb", "Multi-disk archives are not accepted.", 415);
  const entryCount = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (entryCount > MAX_ZIP_ENTRIES) throw new ResumeError("zip_bomb", "The document archive has too many files.", 415);
  if (cdOffset + cdSize > buf.length) throw new ResumeError("invalid_docx", "The Word file is truncated or malformed.", 415);
  let uncompressed = 0;
  let compressed = 0;
  const names: string[] = [];
  let offset = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== 0x02014b50) {
      throw new ResumeError("invalid_docx", "The Word file directory is malformed.", 415);
    }
    const method = buf.readUInt16LE(offset + 10);
    const comp = buf.readUInt32LE(offset + 20);
    const uncomp = buf.readUInt32LE(offset + 24);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const name = buf.subarray(offset + 46, offset + 46 + nameLen).toString("utf8");
    if (name.includes("..") || name.startsWith("/") || name.includes("\\") || name.includes("\0")) {
      throw new ResumeError("path_traversal", "The document contained an unsafe file path.", 415);
    }
    if (method !== 0 && method !== 8) {
      throw new ResumeError("unsupported_zip", "The Word file uses an unsupported compression method.", 415);
    }
    names.push(name);
    uncompressed += uncomp;
    compressed += comp;
    offset += 46 + nameLen + extraLen + commentLen;
  }
  if (uncompressed > MAX_UNCOMPRESSED) {
    throw new ResumeError("zip_bomb", "The document expands beyond the allowed size.", 415);
  }
  if (compressed > 0 && uncompressed / compressed > MAX_RATIO && uncompressed > 1_000_000) {
    throw new ResumeError("zip_bomb", "The document compression ratio is unsafe.", 415);
  }
  return names;
}

function looksLikeText(buf: Buffer) {
  const sample = buf.subarray(0, Math.min(buf.length, 8192));
  if (sample.includes(0)) return false;
  let weird = 0;
  for (const byte of sample) {
    if (byte < 9 || (byte > 13 && byte < 32)) weird += 1;
  }
  return weird / Math.max(sample.length, 1) < 0.05;
}

export function detectResumeKind(buffer: Buffer, filename: string, declaredMime: string): ResumeFileKind {
  const name = filename.toLowerCase();
  const mime = declaredMime.toLowerCase();
  const isPdfMagic = buffer.length >= 5 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
  const isZipMagic =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);

  if (isPdfMagic) {
    if (name.endsWith(".docx") || mime.includes("wordprocessingml")) {
      throw new ResumeError("type_mismatch", "File contents do not match the declared Word document type.", 415);
    }
    return "pdf";
  }
  if (isZipMagic) {
    const names = inspectZip(buffer);
    if (!names.includes("word/document.xml") && !names.some((item) => item === "[Content_Types].xml")) {
      throw new ResumeError("invalid_docx", "The archive is not a Word document.", 415);
    }
    if (!names.includes("word/document.xml")) {
      throw new ResumeError("invalid_docx", "The Word document is missing its document part.", 415);
    }
    if (name.endsWith(".pdf") || mime.includes("pdf")) {
      throw new ResumeError("type_mismatch", "File contents do not match the declared PDF type.", 415);
    }
    return "docx";
  }
  if (looksLikeText(buffer) && (name.endsWith(".txt") || mime.startsWith("text/") || mime === "application/octet-stream" || !name.includes("."))) {
    return "txt";
  }
  throw new ResumeError("unsupported_type", "Upload a PDF, DOCX, or TXT resume.", 415);
}
