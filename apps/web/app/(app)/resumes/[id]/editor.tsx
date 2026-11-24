"use client";

import { RESUME_SECTION_IDS, type ResumeTemplateId, type StructuredResume } from "@hireflow/shared";
import { Button, Field, Input, Textarea } from "@hireflow/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveResumeAction } from "../actions";
import { ResumePreview } from "./preview";

export function ResumeEditor({
  resumeId,
  title,
  templateId,
  initial,
}: {
  resumeId: string;
  title: string;
  templateId: ResumeTemplateId;
  initial: StructuredResume;
}) {
  const [content, setContent] = useState(initial);
  const [name, setName] = useState(title);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const serial = useMemo(() => JSON.stringify({ content, name }), [content, name]);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    setStatus("saving");
    const timer = setTimeout(() => {
      saveResumeAction({ resumeId, content, title: name, templateId })
        .then(() => {
          setStatus("saved");
          setError(null);
        })
        .catch((err: unknown) => {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Save failed. Your last successful draft is kept.");
        });
    }, 800);
    return () => clearTimeout(timer);
  }, [serial, resumeId, templateId, content, name]);

  const skills = content.skills[0]?.items.join(", ") ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Field label="Resume title">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <p className="text-sm text-[var(--color-ink-soft)]" aria-live="polite">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Save failed" : "Ready"}
          </p>
        </div>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Full name">
            <Input
              value={content.personal.fullName ?? ""}
              onChange={(event) =>
                setContent({ ...content, personal: { ...content.personal, fullName: event.target.value } })
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
        </div>
        <Field label="Summary">
          <Textarea
            value={content.personal.summary ?? ""}
            onChange={(event) =>
              setContent({ ...content, personal: { ...content.personal, summary: event.target.value } })
            }
          />
        </Field>
        <Field label="Skills">
          <Input
            value={skills}
            onChange={(event) =>
              setContent({
                ...content,
                skills: [
                  {
                    id: content.skills[0]?.id ?? "skills",
                    category: content.skills[0]?.category ?? "",
                    items: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                  },
                ],
              })
            }
          />
        </Field>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Experience</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setContent({
                  ...content,
                  experience: [
                    ...content.experience,
                    {
                      id: crypto.randomUUID(),
                      title: "",
                      company: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      responsibilities: [""],
                      achievements: [],
                    },
                  ],
                })
              }
            >
              Add role
            </Button>
          </div>
          {content.experience.map((row, index) => (
            <div key={row.id} className="rounded-[var(--radius-md)] border border-[var(--color-rule)] p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title">
                  <Input
                    value={row.title}
                    onChange={(event) => {
                      const experience = [...content.experience];
                      experience[index] = { ...row, title: event.target.value };
                      setContent({ ...content, experience });
                    }}
                  />
                </Field>
                <Field label="Company">
                  <Input
                    value={row.company}
                    onChange={(event) => {
                      const experience = [...content.experience];
                      experience[index] = { ...row, company: event.target.value };
                      setContent({ ...content, experience });
                    }}
                  />
                </Field>
                <Field label="Start date">
                  <Input
                    value={row.startDate ?? ""}
                    onChange={(event) => {
                      const experience = [...content.experience];
                      experience[index] = { ...row, startDate: event.target.value };
                      setContent({ ...content, experience });
                    }}
                  />
                </Field>
                <Field label="End date">
                  <Input
                    value={row.endDate ?? ""}
                    onChange={(event) => {
                      const experience = [...content.experience];
                      experience[index] = { ...row, endDate: event.target.value };
                      setContent({ ...content, experience });
                    }}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Responsibilities (one per line)">
                  <Textarea
                    value={row.responsibilities.join("\n")}
                    onChange={(event) => {
                      const experience = [...content.experience];
                      experience[index] = {
                        ...row,
                        responsibilities: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                      };
                      setContent({ ...content, experience });
                    }}
                  />
                </Field>
              </div>
              <button
                type="button"
                className="mt-2 text-sm text-[var(--color-danger)]"
                onClick={() =>
                  setContent({ ...content, experience: content.experience.filter((item) => item.id !== row.id) })
                }
              >
                Remove role
              </button>
            </div>
          ))}
        </div>
        <Field label="Section order">
          <Input
            value={content.sectionOrder.join(", ")}
            onChange={(event) => {
              const next = event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter((item): item is (typeof RESUME_SECTION_IDS)[number] =>
                  (RESUME_SECTION_IDS as readonly string[]).includes(item),
                );
              if (next.length) setContent({ ...content, sectionOrder: next });
            }}
          />
        </Field>
      </div>
      <div className="lg:sticky lg:top-6">
        <p className="mb-3 text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Live preview</p>
        <div className="overflow-auto rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4">
          <ResumePreview resume={content} templateId={templateId} />
        </div>
      </div>
    </div>
  );
}
