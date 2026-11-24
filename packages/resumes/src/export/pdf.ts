import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ResumeTemplateId, StructuredResume } from "@hireflow/shared";
import { ResumePdfDocument } from "../templates/document";

export async function exportResumePdf(resume: StructuredResume, templateId: ResumeTemplateId): Promise<Buffer> {
  const element = createElement(ResumePdfDocument, { resume, templateId });
  const buffer = await renderToBuffer(element);
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}
