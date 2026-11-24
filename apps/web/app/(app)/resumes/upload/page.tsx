import { Button, Card } from "@hireflow/ui";
import { parseResumeAction } from "../actions";

export default function UploadResumePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Upload</p>
        <h1 className="font-display mt-1 text-4xl">Import a resume</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          PDF, DOCX, or TXT up to 5 MB. Files stay private. Scanned image PDFs cannot be read without
          OCR, which is not enabled. You will review every extracted field before save.
        </p>
      </div>
      <Card>
        <form action={parseResumeAction} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
              Resume file
            </span>
            <input
              type="file"
              name="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              required
              className="block w-full text-sm"
            />
          </label>
          <Button type="submit">Extract and review</Button>
        </form>
      </Card>
    </div>
  );
}
