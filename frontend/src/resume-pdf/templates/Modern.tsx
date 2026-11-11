import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatResumeDate, formatResumeDateRange } from '../../lib/resume/dates';
import { GREY, INK, type Theme, type } from '../theme';
import { ContactLine, Entry, Section } from './shared';
import { FONTS, PAGE_SIZE_NAMES, contactParts, documentMeta, tidy, type TemplateProps } from './types';

// Modern: left-aligned, all Roboto, with the accent colour on the name, the
// section headings, and a short rule under each heading.

function buildStyles(t: Theme) {
  return StyleSheet.create({
    page: { paddingVertical: t.margin, paddingHorizontal: t.margin + 4, fontFamily: FONTS.sans, fontSize: t.body, color: GREY },
    name: { ...type(t.name, 1.05), fontWeight: 700, color: t.accent, letterSpacing: -0.3 },
    headline: { ...type(t.heading, 1.2), fontWeight: 500, color: INK, marginTop: 1 },
    contact: { ...type(t.small, t.lineHeight), marginTop: 3 },
    link: { color: GREY, textDecoration: 'none' },
    headerRule: { marginTop: 7, height: 1.5, backgroundColor: t.accent, width: 36 },

    section: { marginTop: t.sectionGap },
    heading: {
      ...type(t.small, 1.2),
      fontWeight: 700,
      color: t.accent,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: Math.max(4, t.sectionGap * 0.55),
    },
    summary: type(t.body, t.lineHeight + 0.1),

    skillRow: { flexDirection: 'row', marginBottom: 2 },
    skillLabel: { ...type(t.body, t.lineHeight), fontWeight: 500, color: INK, width: '28%', paddingRight: 8 },
    skillItems: { ...type(t.body, t.lineHeight), flex: 1 },

    entry: { marginBottom: t.entryGap },
    lastEntry: { marginBottom: 0 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    left: { ...type(t.body, 1.25), flexShrink: 1, paddingRight: 12 },
    right: { ...type(t.small, 1.25), flexShrink: 0, textAlign: 'right' },
    leftBold: { ...type(t.body + 0.5, 1.25), flexShrink: 1, paddingRight: 12, fontWeight: 700, color: INK },
    rightBold: { ...type(t.small, 1.25), flexShrink: 0, textAlign: 'right', fontWeight: 500, color: INK },
    secondRow: { marginTop: 1.5 },
    note: { ...type(t.body, 1.25), marginTop: 3 },

    bullets: { marginTop: t.bulletGap + 2 },
    bullet: { flexDirection: 'row', marginBottom: t.bulletGap },
    dot: { ...type(t.body, t.lineHeight - 0.03), width: 9, color: t.accent, fontWeight: 700 },
    bulletText: { ...type(t.body, t.lineHeight - 0.03), flex: 1 },
  });
}

export default function Modern({ content: raw, pageSize, theme }: TemplateProps) {
  const content = tidy(raw);
  const styles = buildStyles(theme);
  const heading = (text: string) => <Text style={styles.heading}>{text}</Text>;
  // The headline gets its own line under the name, so it's left out of the contact line.
  const contact = contactParts({ ...content, title: '' });

  return (
    <Document {...documentMeta(content)}>
      <Page size={PAGE_SIZE_NAMES[pageSize]} style={styles.page}>
        {content.name.trim() ? <Text style={styles.name}>{content.name.trim()}</Text> : null}
        {content.title.trim() ? <Text style={styles.headline}>{content.title.trim()}</Text> : null}
        <ContactLine parts={contact} separator="   ·   " style={styles.contact} linkStyle={styles.link} />
        <View style={styles.headerRule} />

        {content.summary.trim() ? (
          <Section heading={heading('Profile')} style={styles.section}>
            <Text style={styles.summary}>{content.summary.trim()}</Text>
          </Section>
        ) : null}

        {content.skills.length > 0 && (
          <Section heading={heading('Skills')} style={styles.section}>
            {content.skills.map((group, index) => (
              <View key={index} style={styles.skillRow} wrap={false}>
                <Text style={styles.skillLabel}>{group.label}</Text>
                <Text style={styles.skillItems}>{group.items.join(' · ')}</Text>
              </View>
            ))}
          </Section>
        )}

        {content.experience.length > 0 && (
          <Section heading={heading('Experience')} style={styles.section}>
            {content.experience.map((job, index) => (
              <Entry
                key={index}
                styles={styles}
                title={job.title}
                aside={formatResumeDateRange(job.start, job.end)}
                subtitle={[job.company.trim(), job.location.trim()].filter(Boolean).join('  ·  ')}
                bullets={job.bullets}
                last={index === content.experience.length - 1}
                marker="•"
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
                title={school.school}
                aside={formatResumeDate(school.date)}
                asideBold={false}
                subtitle={school.degree}
                note={school.honors.trim()}
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
                title={item.title}
                aside={formatResumeDate(item.date)}
                asideBold={false}
                subtitle={item.subtitle}
                bullets={item.bullets}
                last={index === section.items.length - 1}
                marker="•"
              />
            ))}
          </Section>
        ))}
      </Page>
    </Document>
  );
}
