import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ResumeTemplateId, StructuredResume } from "@hireflow/shared";

const A4 = { width: "A4" as const };

function theme(templateId: ResumeTemplateId) {
  if (templateId === "modern-professional") {
    return {
      font: "Helvetica",
      nameSize: 20,
      headingSize: 11,
      bodySize: 10,
      margin: 48,
      gap: 10,
      line: "#0f6b5c",
      accent: "#0f6b5c",
      headingTransform: "uppercase" as const,
    };
  }
  if (templateId === "compact-technical") {
    return {
      font: "Helvetica",
      nameSize: 16,
      headingSize: 10,
      bodySize: 9,
      margin: 36,
      gap: 6,
      line: "#14221c",
      accent: "#14221c",
      headingTransform: "uppercase" as const,
    };
  }
  return {
    font: "Times-Roman",
    nameSize: 18,
    headingSize: 11,
    bodySize: 10,
    margin: 54,
    gap: 8,
    line: "#14221c",
    accent: "#14221c",
    headingTransform: "uppercase" as const,
  };
}

function contactLine(resume: StructuredResume) {
  return [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    ...resume.links.map((link) => link.url),
  ]
    .filter(Boolean)
    .join("  ·  ");
}

function skillsLine(resume: StructuredResume) {
  return resume.skills
    .flatMap((group) => (group.category ? [`${group.category}: ${group.items.join(", ")}`] : group.items))
    .join(resume.skills.some((group) => group.category) ? "  |  " : ", ");
}

export function ResumePdfDocument({
  resume,
  templateId,
}: {
  resume: StructuredResume;
  templateId: ResumeTemplateId;
}) {
  const t = theme(templateId);
  const styles = StyleSheet.create({
    page: {
      fontFamily: t.font,
      fontSize: t.bodySize,
      color: "#14221c",
      paddingTop: t.margin,
      paddingBottom: t.margin,
      paddingLeft: t.margin,
      paddingRight: t.margin,
    },
    name: { fontSize: t.nameSize, fontFamily: t.font === "Helvetica" ? "Helvetica-Bold" : "Times-Bold" },
    headline: { marginTop: 4, fontSize: t.bodySize + 1 },
    contact: { marginTop: 4, fontSize: t.bodySize - 1, color: "#3d4f47" },
    heading: {
      marginTop: t.gap + 4,
      marginBottom: 4,
      fontSize: t.headingSize,
      letterSpacing: 0.8,
      textTransform: t.headingTransform,
      color: t.accent,
      borderBottomWidth: 0.8,
      borderBottomColor: t.line,
      paddingBottom: 2,
      fontFamily: t.font === "Helvetica" ? "Helvetica-Bold" : "Times-Bold",
    },
    itemTitle: { fontFamily: t.font === "Helvetica" ? "Helvetica-Bold" : "Times-Bold" },
    muted: { color: "#3d4f47" },
    bullet: { marginLeft: 10, marginTop: 2 },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  });

  const order =
    templateId === "compact-technical"
      ? ["skills", "projects", "experience", "education", "certifications", "achievements", "languages", "links", "custom", "summary"]
      : resume.sectionOrder;

  const sections: Record<string, ReactNode> = {
    summary: resume.personal.summary ? (
      <View wrap={false}>
        <Text style={styles.heading}>Summary</Text>
        <Text>{resume.personal.summary}</Text>
      </View>
    ) : null,
    skills: skillsLine(resume) ? (
      <View>
        <Text style={styles.heading}>Skills</Text>
        <Text>{skillsLine(resume)}</Text>
      </View>
    ) : null,
    experience: resume.experience.length ? (
      <View>
        <Text style={styles.heading}>Experience</Text>
        {resume.experience.map((row) => (
          <View key={row.id} style={{ marginBottom: 8 }} wrap={false}>
            <View style={styles.row}>
              <Text style={styles.itemTitle}>{[row.title, row.company].filter(Boolean).join(" — ")}</Text>
              <Text style={styles.muted}>{[row.startDate, row.endDate].filter(Boolean).join(" – ")}</Text>
            </View>
            {row.location ? <Text style={styles.muted}>{row.location}</Text> : null}
            {[...row.responsibilities, ...row.achievements].map((line) => (
              <Text key={line} style={styles.bullet}>
                • {line}
              </Text>
            ))}
          </View>
        ))}
      </View>
    ) : null,
    projects: resume.projects.length ? (
      <View>
        <Text style={styles.heading}>Projects</Text>
        {resume.projects.map((row) => (
          <View key={row.id} style={{ marginBottom: 6 }} wrap={false}>
            <Text style={styles.itemTitle}>{row.name}</Text>
            {row.summary ? <Text>{row.summary}</Text> : null}
            {row.technologies.length ? <Text style={styles.muted}>{row.technologies.join(", ")}</Text> : null}
            {row.bullets.map((line) => (
              <Text key={line} style={styles.bullet}>
                • {line}
              </Text>
            ))}
          </View>
        ))}
      </View>
    ) : null,
    education: resume.education.length ? (
      <View>
        <Text style={styles.heading}>Education</Text>
        {resume.education.map((row) => (
          <View key={row.id} style={{ marginBottom: 4 }} wrap={false}>
            <View style={styles.row}>
              <Text style={styles.itemTitle}>{[row.credential, row.school].filter(Boolean).join(" — ")}</Text>
              <Text style={styles.muted}>{[row.startDate, row.endDate].filter(Boolean).join(" – ")}</Text>
            </View>
            {row.field ? <Text>{row.field}</Text> : null}
            {row.details.map((line) => (
              <Text key={line} style={styles.bullet}>
                • {line}
              </Text>
            ))}
          </View>
        ))}
      </View>
    ) : null,
    certifications: resume.certifications.length ? (
      <View>
        <Text style={styles.heading}>Certifications</Text>
        {resume.certifications.map((row) => (
          <Text key={row.id}>• {[row.name, row.issuer, row.date].filter(Boolean).join(" — ")}</Text>
        ))}
      </View>
    ) : null,
    achievements: resume.achievements.length ? (
      <View>
        <Text style={styles.heading}>Achievements</Text>
        {resume.achievements.map((line) => (
          <Text key={line} style={styles.bullet}>
            • {line}
          </Text>
        ))}
      </View>
    ) : null,
    languages: resume.languages.length ? (
      <View>
        <Text style={styles.heading}>Languages</Text>
        <Text>{resume.languages.map((row) => [row.name, row.proficiency].filter(Boolean).join(" — ")).join("  ·  ")}</Text>
      </View>
    ) : null,
    links: null,
    custom: resume.customSections.map((section) => (
      <View key={section.id}>
        <Text style={styles.heading}>{section.title}</Text>
        {section.items.map((line) => (
          <Text key={line} style={styles.bullet}>
            • {line}
          </Text>
        ))}
      </View>
    )),
  };

  return (
    <Document>
      <Page size={A4.width} style={styles.page} wrap>
        <Text style={styles.name}>{resume.personal.fullName || "Resume"}</Text>
        {resume.personal.headline ? <Text style={styles.headline}>{resume.personal.headline}</Text> : null}
        <Text style={styles.contact}>{contactLine(resume)}</Text>
        {order.map((id) => (
          <View key={id}>{sections[id]}</View>
        ))}
      </Page>
    </Document>
  );
}
