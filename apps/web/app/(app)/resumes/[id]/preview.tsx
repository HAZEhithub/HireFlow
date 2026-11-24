import type { ResumeTemplateId, StructuredResume } from "@hireflow/shared";

function contactLine(resume: StructuredResume) {
  return [resume.personal.email, resume.personal.phone, resume.personal.location, ...resume.links.map((l) => l.url)]
    .filter(Boolean)
    .join("  ·  ");
}

export function ResumePreview({
  resume,
  templateId,
}: {
  resume: StructuredResume;
  templateId: ResumeTemplateId;
}) {
  const compact = templateId === "compact-technical";
  const modern = templateId === "modern-professional";
  const order =
    templateId === "compact-technical"
      ? ["skills", "projects", "experience", "education", "summary", "certifications"]
      : resume.sectionOrder;
  const font = compact || modern ? "font-sans" : "font-serif";

  return (
    <article
      className={`mx-auto min-h-[842px] w-full max-w-[595px] bg-white p-10 text-[13px] leading-5 text-[#14221c] shadow-[0_8px_40px_rgba(20,34,28,0.08)] ${font}`}
      aria-label="Resume preview"
    >
      <h1 className={`${compact ? "text-xl" : "text-2xl"} font-semibold tracking-tight`}>
        {resume.personal.fullName || "Your name"}
      </h1>
      {resume.personal.headline ? (
        <p className="mt-1 text-[var(--color-ink-soft)]">{resume.personal.headline}</p>
      ) : null}
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{contactLine(resume)}</p>
      {order.map((id) => {
        if (id === "summary" && resume.personal.summary) {
          return (
            <section key={id} className="mt-5">
              <h2 className="border-b border-[#14221c] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Summary
              </h2>
              <p className="mt-2">{resume.personal.summary}</p>
            </section>
          );
        }
        if (id === "skills" && resume.skills.some((g) => g.items.length)) {
          return (
            <section key={id} className="mt-5">
              <h2 className="border-b border-[#14221c] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Skills
              </h2>
              <p className="mt-2">{resume.skills.flatMap((g) => g.items).join(", ")}</p>
            </section>
          );
        }
        if (id === "experience" && resume.experience.length) {
          return (
            <section key={id} className="mt-5">
              <h2 className="border-b border-[#14221c] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Experience
              </h2>
              {resume.experience.map((row) => (
                <div key={row.id} className="mt-3">
                  <div className="flex justify-between gap-3">
                    <p className="font-semibold">{[row.title, row.company].filter(Boolean).join(" — ")}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {[row.startDate, row.endDate].filter(Boolean).join(" – ")}
                    </p>
                  </div>
                  <ul className="mt-1 list-disc pl-5">
                    {[...row.responsibilities, ...row.achievements].map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          );
        }
        if (id === "projects" && resume.projects.length) {
          return (
            <section key={id} className="mt-5">
              <h2 className="border-b border-[#14221c] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Projects
              </h2>
              {resume.projects.map((row) => (
                <div key={row.id} className="mt-3">
                  <p className="font-semibold">{row.name}</p>
                  {row.summary ? <p>{row.summary}</p> : null}
                  <ul className="mt-1 list-disc pl-5">
                    {row.bullets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          );
        }
        if (id === "education" && resume.education.length) {
          return (
            <section key={id} className="mt-5">
              <h2 className="border-b border-[#14221c] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Education
              </h2>
              {resume.education.map((row) => (
                <p key={row.id} className="mt-2">
                  {[row.credential, row.school, row.endDate].filter(Boolean).join(" — ")}
                </p>
              ))}
            </section>
          );
        }
        if (id === "certifications" && resume.certifications.length) {
          return (
            <section key={id} className="mt-5">
              <h2 className="border-b border-[#14221c] pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Certifications
              </h2>
              {resume.certifications.map((row) => (
                <p key={row.id}>{row.name}</p>
              ))}
            </section>
          );
        }
        return null;
      })}
    </article>
  );
}
