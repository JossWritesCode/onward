import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatResumeDate, formatResumeDateRange } from '../../lib/resume/dates';
import { GREY, INK, RULE, type Theme, type } from '../theme';
import { ContactLine, Entry, Section } from './shared';
import { FONTS, PAGE_SIZE_NAMES, documentMeta, tidy, type TemplateProps } from './types';

// Compact: everything in Roboto, with small uppercase section headings and
// the name on the left with contact details beside it. Entries put the title
// and company on one line, so each job takes a row less than in Classic.

function buildStyles(t: Theme) {
  const tight = Math.max(1.15, t.lineHeight - 0.1);
  return StyleSheet.create({
    page: { paddingVertical: t.margin, paddingHorizontal: t.margin, fontFamily: FONTS.sans, fontSize: t.body, color: GREY },
    header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 5, borderBottomWidth: 1.25, borderBottomColor: INK },
    name: { ...type(Math.round(t.name * 0.8), 1.05), fontWeight: 700, color: '#000000', flexShrink: 1, paddingRight: 12 },
    contact: { flexShrink: 0, maxWidth: '58%', alignItems: 'flex-end' },
    contactLine: { ...type(t.small, tight), textAlign: 'right' },
    link: { color: GREY, textDecoration: 'none' },

    section: { marginTop: t.sectionGap },
    heading: {
      ...type(t.small, 1.2),
      fontWeight: 700,
      color: '#000000',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingBottom: 1.5,
      borderBottomWidth: 0.5,
      borderBottomColor: RULE,
      marginBottom: Math.max(3, t.sectionGap * 0.45),
    },
    summary: type(t.body, t.lineHeight),

    skillLine: { ...type(t.body, tight), marginBottom: 1 },
    bold: { fontWeight: 500, color: INK },

    entry: { marginBottom: Math.max(3, t.entryGap * 0.75) },
    lastEntry: { marginBottom: 0 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    left: { ...type(t.body, 1.2), flexShrink: 1, paddingRight: 10 },
    right: { ...type(t.small, 1.2), flexShrink: 0, textAlign: 'right' },
    leftBold: { ...type(t.body, 1.2), flexShrink: 1, paddingRight: 10, fontWeight: 500, color: INK },
    rightBold: { ...type(t.small, 1.2), flexShrink: 0, textAlign: 'right', fontWeight: 500, color: INK },
    secondRow: { marginTop: 0.5 },
    note: { ...type(t.body, 1.2), marginTop: 1.5 },

    bullets: { marginTop: t.bulletGap + 1 },
    bullet: { flexDirection: 'row', marginBottom: Math.max(0.5, t.bulletGap - 1) },
    dot: { ...type(t.body, tight), width: 7.5 },
    bulletText: { ...type(t.body, tight), flex: 1 },
  });
}

/** "Software Engineer, Shopify" when both are known. */
const joined = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(', ');

export default function Compact({ content: raw, pageSize, theme }: TemplateProps) {
  const content = tidy(raw);
  const styles = buildStyles(theme);
  const heading = (text: string) => <Text style={styles.heading}>{text}</Text>;
  // Contact details in short lines beside the name, rather than one long run that wraps mid-separator.
  const contactLines = [
    [content.title, content.location],
    [content.phone, content.email],
    ...content.links.map((link) => [link]),
  ]
    .map((line) => line.map((part) => part.trim()).filter(Boolean))
    .filter((line) => line.length > 0);

  return (
    <Document {...documentMeta(content)}>
      <Page size={PAGE_SIZE_NAMES[pageSize]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{content.name.trim()}</Text>
          <View style={styles.contact}>
            {contactLines.map((line, index) => (
              <ContactLine key={index} parts={line} separator="  |  " style={styles.contactLine} linkStyle={styles.link} />
            ))}
          </View>
        </View>

        {content.summary.trim() ? (
          <Section heading={heading('Summary')} style={styles.section}>
            <Text style={styles.summary}>{content.summary.trim()}</Text>
          </Section>
        ) : null}

        {content.skills.length > 0 && (
          <Section heading={heading('Skills')} style={styles.section}>
            {content.skills.map((group, index) => (
              <Text key={index} style={styles.skillLine}>
                {group.label ? <Text style={styles.bold}>{group.label}:  </Text> : null}
                {group.items.join(', ')}
              </Text>
            ))}
          </Section>
        )}

        {content.experience.length > 0 && (
          <Section heading={heading('Experience')} style={styles.section}>
            {content.experience.map((job, index) => (
              <Entry
                key={index}
                styles={styles}
                title={joined(job.title, job.company)}
                aside={formatResumeDateRange(job.start, job.end)}
                asideBold={false}
                subtitle={job.location}
                bullets={job.bullets}
                last={index === content.experience.length - 1}
                marker="–"
              />
            ))}
          </Section>
        )}

        {content.education.length > 0 && (
          <Section heading={heading('Education')} style={styles.section}>
            {content.education.map((school, index) => (
              <Entry
                key={index}
                styles={styles}
                title={joined(school.degree, school.school)}
                aside={formatResumeDate(school.date)}
                asideBold={false}
                subtitle={school.honors.trim()}
                last={index === content.education.length - 1}
              />
            ))}
          </Section>
        )}

        {content.sections.map((section, sectionIndex) => (
          <Section key={sectionIndex} heading={heading(section.heading || 'More')} style={styles.section}>
            {section.items.map((item, index) => (
              <Entry
                key={index}
                styles={styles}
                title={joined(item.title, item.subtitle)}
                aside={formatResumeDate(item.date)}
                asideBold={false}
                bullets={item.bullets}
                last={index === section.items.length - 1}
                marker="–"
              />
            ))}
          </Section>
        ))}
      </Page>
    </Document>
  );
}
