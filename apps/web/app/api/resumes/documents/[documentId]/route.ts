import { getDb } from "@hireflow/db";
import { readOwnedDocument } from "@hireflow/resumes";
import { requireUser } from "../../../../../lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const user = await requireUser();
  const { documentId } = await context.params;
  const db = await getDb();
  const { doc, bytes } = await readOwnedDocument(db, user.id, documentId);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": doc.mimeType,
      "content-disposition": `attachment; filename="${doc.originalFilename.replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
