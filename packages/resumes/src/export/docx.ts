import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ResumeTemplateId, StructuredResume } from "@hireflow/shared";

function heading(text: string, compact: boolean) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: compact ? 160 : 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: compact ? "14221C" : "0F6B5C", space: 4 },
    },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: compact ? "Calibri" : "Calibri", size: compact ? 20 : 22 })],
  });
}

function bullets(items: string[]) {
  return items.filter(Boolean).map(
    (text) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text, size: 20 })],
      }),
  );
}

export async function exportResumeDocx(resume: StructuredResume, templateId: ResumeTemplateId): Promise<Buffer> {
  const compact = templateId === "compact-technical";
  const modern = templateId === "modern-professional";
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: resume.personal.fullName || "Resume",
          bold: true,
          size: compact ? 32 : 40,
          font: modern || compact ? "Calibri" : "Cambria",
        }),
      ],
    }),
  ];
  if (resume.personal.headline) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: resume.personal.headline, italics: true, size: 22 })],
      }),
    );
  }
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: [resume.personal.email, resume.personal.phone, resume.personal.location, ...resume.links.map((l) => l.url)]
            .filter(Boolean)
            .join("  ·  "),
          size: 18,
          color: "3D4F47",
        }),
      ],
    }),
  );

  const order =
    templateId === "compact-technical"
      ? ["skills", "projects", "experience", "education", "summary", "certifications", "achievements", "languages"]
      : resume.sectionOrder;

  for (const id of order) {
    if (id === "summary" && resume.personal.summary) {
      children.push(heading("Summary", compact), new Paragraph(resume.personal.summary));
    }
    if (id === "skills" && resume.skills.some((g) => g.items.length)) {
      children.push(
        heading("Skills", compact),
        new Paragraph(resume.skills.flatMap((g) => g.items).join(", ")),
      );
    }
    if (id === "experience" && resume.experience.length) {
      children.push(heading("Experience", compact));
      for (const row of resume.experience) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: [row.title, row.company].filter(Boolean).join(" — "), bold: true, size: 22 }),
              new TextRun({
                text: `    ${[row.startDate, row.endDate].filter(Boolean).join(" – ")}`,
                size: 20,
                color: "3D4F47",
              }),
            ],
          }),
        );
        children.push(...bullets([...row.responsibilities, ...row.achievements]));
      }
    }
    if (id === "projects" && resume.projects.length) {
      children.push(heading("Projects", compact));
      for (const row of resume.projects) {
        children.push(new Paragraph({ children: [new TextRun({ text: row.name, bold: true })] }));
        if (row.summary) children.push(new Paragraph(row.summary));
        children.push(...bullets(row.bullets));
      }
    }
    if (id === "education" && resume.education.length) {
      children.push(heading("Education", compact));
      for (const row of resume.education) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: [row.credential, row.school].filter(Boolean).join(" — "), bold: true }),
            ],
          }),
        );
        children.push(...bullets(row.details));
      }
    }
    if (id === "certifications" && resume.certifications.length) {
      children.push(heading("Certifications", compact), ...bullets(resume.certifications.map((row) => row.name)));
    }
    if (id === "achievements" && resume.achievements.length) {
      children.push(heading("Achievements", compact), ...bullets(resume.achievements));
    }
    if (id === "languages" && resume.languages.length) {
      children.push(
        heading("Languages", compact),
        new Paragraph(resume.languages.map((row) => [row.name, row.proficiency].filter(Boolean).join(" — ")).join(" · ")),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: compact ? 720 : 1080, bottom: compact ? 720 : 1080, left: compact ? 720 : 1080, right: compact ? 720 : 1080 },
          },
        },
        children,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
