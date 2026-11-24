"use client";

import { emptyStructuredResume, type StructuredResume } from "@hireflow/shared";
import { Button, Card, Field, Input, Textarea } from "@hireflow/ui";
import { useMemo, useState } from "react";
import { confirmResumeAction } from "./actions";

export function ReviewForm({
  documentId,
  filename,
  initial,
  warnings,
  missingFields,
  likelyScanned,
}: {
  documentId: string;
  filename: string;
  initial: StructuredResume;
  warnings: string[];
  missingFields: string[];
  likelyScanned: boolean;
}) {
  const [content, setContent] = useState<StructuredResume>(initial ?? emptyStructuredResume());
  const payload = useMemo(() => JSON.stringify(content), [content]);

  return (
    <form action={confirmResumeAction} className="space-y-6">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="content" value={payload} />
      {likelyScanned ? (
        <Card>
          <h2 className="font-display text-xl">Scanned PDF</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Almost no text was extracted. OCR is not enabled, so HireFlow is not claiming this
            document was parsed. Upload a text-based PDF, DOCX, or TXT, or fill the fields yourself.
          </p>
        </Card>
      ) : null}
      {warnings.length ? (
        <Card>
          <h2 className="font-display text-xl">Extraction notes</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
            {warnings.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card>
        <p className="text-sm text-[var(--color-ink-soft)]">Source file: {filename}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Resume title">
            <Input name="title" defaultValue={content.personal.fullName || "Uploaded resume"} />
          </Field>
          <Field label="Full name">
            <Input
              value={content.personal.fullName ?? ""}
              onChange={(event) =>
                setContent({ ...content, personal: { ...content.personal, fullName: event.target.value } })
              }
            />
          </Field>
          <Field label="Email">
            <Input
              value={content.personal.email ?? ""}
              onChange={(event) =>
                setContent({ ...content, personal: { ...content.personal, email: event.target.value } })
              }
            />
          </Field>
          <Field label="Phone">
            <Input
              value={content.personal.phone ?? ""}
              onChange={(event) =>
                setContent({ ...content, personal: { ...content.personal, phone: event.target.value } })
              }
            />
          </Field>
          <Field label="Location">
            <Input
              value={content.personal.location ?? ""}
              onChange={(event) =>
                setContent({ ...content, personal: { ...content.personal, location: event.target.value } })
              }
            />
          </Field>
          <Field label="Headline">
            <Input
              value={content.personal.headline ?? ""}
              onChange={(event) =>
                setContent({ ...content, personal: { ...content.personal, headline: event.target.value } })
              }
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Summary">
            <Textarea
              value={content.personal.summary ?? ""}
              onChange={(event) =>
                setContent({ ...content, personal: { ...content.personal, summary: event.target.value } })
              }
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Skills (comma separated)" hint="Do not add skills that are not yours.">
            <Input
              value={content.skills[0]?.items.join(", ") ?? ""}
              onChange={(event) =>
                setContent({
                  ...content,
                  skills: [
                    {
                      id: content.skills[0]?.id ?? "skills",
                      category: "",
                      items: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                    },
                  ],
                })
              }
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" name="copyToProfile" />
          Also copy confirmed name, summary, location, and skills into my career profile
        </label>
        {missingFields.length ? (
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Missing after extraction: {missingFields.join(", ")}. Fill only what is true.
          </p>
        ) : null}
        <div className="mt-6">
          <Button type="submit">Confirm and save resume</Button>
        </div>
      </Card>
    </form>
  );
}
