import { Document, Page, StyleSheet, Text } from '@react-pdf/renderer';
import { formatResumeDate, formatResumeDateRange } from '../../lib/resume/dates';
import { GREY, INK, RULE, SEPARATOR, type Theme, type } from '../theme';
import { ContactLine, Entry, Section } from './shared';
import { FONTS, PAGE_SIZE_NAMES, contactParts, documentMeta, tidy, type TemplateProps } from './types';

// Classic: one column. The name is large and centred in a serif, section
// headings are serif with a thin grey line under them, and the rest is Roboto.

function buildStyles(t: Theme) {
  return StyleSheet.create({
    page: { paddingVertical: t.margin, paddingHorizontal: t.margin + 2, fontFamily: FONTS.sans, fontSize: t.body, color: GREY },
    name: { ...type(t.name, 1.1), fontFamily: FONTS.serif, textAlign: 'center', color: '#000000' },
    contact: { ...type(t.body, t.lineHeight), marginTop: 2, textAlign: 'center' },
    link: { color: GREY, textDecoration: 'none' },

    section: { marginTop: t.sectionGap },
    heading: {
      ...type(t.heading, 1.15),
      fontFamily: FONTS.serif,
      color: '#000000',
      paddingBottom: 2.5,
      borderBottomWidth: 0.75,
      borderBottomColor: RULE,
      marginBottom: Math.max(4, t.sectionGap * 0.6),
    },
    summary: type(t.body, t.lineHeight + 0.1),

    skillLine: { ...type(t.body, t.lineHeight), marginBottom: 2 },
    bold: { fontWeight: 500, color: INK },

    entry: { marginBottom: t.entryGap },
    lastEntry: { marginBottom: 0 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    left: { ...type(t.body, 1.25), flexShrink: 1, paddingRight: 12 },
    right: { ...type(t.body, 1.25), flexShrink: 0, textAlign: 'right' },
    leftBold: { ...type(t.body, 1.25), flexShrink: 1, paddingRight: 12, fontWeight: 500, color: INK },
    rightBold: { ...type(t.body, 1.25), flexShrink: 0, textAlign: 'right', fontWeight: 500, color: INK },
    secondRow: { marginTop: 1.5 },
    note: { ...type(t.body, 1.25), marginTop: 3 },

    bullets: { marginTop: t.bulletGap + 2 },
    bullet: { flexDirection: 'row', marginBottom: t.bulletGap },
    dot: { ...type(t.body, t.lineHeight - 0.03), width: 8.5 },
    bulletText: { ...type(t.body, t.lineHeight - 0.03), flex: 1 },
  });
}

export default function Classic({ content: raw, pageSize, theme }: TemplateProps) {
  const content = tidy(raw);
  const styles = buildStyles(theme);
  const heading = (text: string) => <Text style={styles.heading}>{text}</Text>;

  return (
    <Document {...documentMeta(content)}>
      <Page size={PAGE_SIZE_NAMES[pageSize]} style={styles.page}>
        {content.name.trim() ? <Text style={styles.name}>{content.name.trim()}</Text> : null}
        <ContactLine parts={contactParts(content)} separator={SEPARATOR} style={styles.contact} linkStyle={styles.link} />

        {content.summary.trim() ? (
          <Section heading={heading('Professional Summary')} style={styles.section}>
            <Text style={styles.summary}>{content.summary.trim()}</Text>
          </Section>
        ) : null}

        {content.skills.length > 0 && (
          <Section heading={heading('Technical Skills')} style={styles.section}>
            {content.skills.map((group, index) => (
              <Text key={index} style={styles.skillLine}>
                {group.label ? <Text style={styles.bold}>{group.label}:  </Text> : null}
                {group.items.join(' · ')}
              </Text>
            ))}
          </Section>
        )}

        {content.experience.length > 0 && (
          <Section heading={heading('Work Experience')} style={styles.section}>
            {content.experience.map((job, index) => (
              <Entry
                key={index}
                styles={styles}
                title={job.title}
                aside={job.location}
                subtitle={job.company}
                subAside={formatResumeDateRange(job.start, job.end)}
                bullets={job.bullets}
                last={index === content.experience.length - 1}
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
                // Without a subtitle, the date moves up beside the title instead of sitting on a row alone.
                aside={item.subtitle.trim() ? undefined : formatResumeDate(item.date)}
                asideBold={false}
                subtitle={item.subtitle}
                subAside={item.subtitle.trim() ? formatResumeDate(item.date) : undefined}
                bullets={item.bullets}
                last={index === section.items.length - 1}
              />
            ))}
          </Section>
        ))}
      </Page>
    </Document>
  );
}
