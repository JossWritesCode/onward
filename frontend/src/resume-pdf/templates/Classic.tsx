import { Children, type ReactNode } from 'react';
import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatResumeDate, formatResumeDateRange } from '../../lib/resume/dates';
import { FONTS, PAGE_SIZE_NAMES, linkTarget, tidy, type TemplateProps } from './types';

// Classic: one column. The name is large and centred in a serif, section
// headings are serif with a thin grey line under them, and the rest is Roboto.

const INK = '#1f1f1f';
const GREY = '#4d4d4d';
const RULE = '#a3a3a3';

const BODY = 9.4;
// " | " with a little more air. The no-break spaces keep the bar with the text before it when a line wraps.
const SEPARATOR = '\u00A0\u00A0|\u00A0 ';

// react-pdf works out line height from the font size in the *same* style, not
// an inherited one, so every text style sets both together.
const type = (fontSize: number, lineHeight: number) => ({ fontSize, lineHeight });

const styles = StyleSheet.create({
  page: { paddingVertical: 30, paddingHorizontal: 32, fontFamily: FONTS.sans, fontSize: BODY, color: GREY },
  name: { ...type(27, 1.1), fontFamily: FONTS.serif, textAlign: 'center', color: '#000000' },
  contact: { ...type(BODY, 1.4), marginTop: 2, textAlign: 'center' },
  link: { color: GREY, textDecoration: 'none' },

  section: { marginTop: 11 },
  heading: {
    ...type(13, 1.15),
    fontFamily: FONTS.serif,
    color: '#000000',
    paddingBottom: 2.5,
    borderBottomWidth: 0.75,
    borderBottomColor: RULE,
    marginBottom: 7,
  },
  summary: type(BODY, 1.5),

  skillLine: { ...type(BODY, 1.4), marginBottom: 2 },
  bold: { fontWeight: 500, color: INK },

  entry: { marginBottom: 8 },
  lastEntry: { marginBottom: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  left: { ...type(BODY, 1.25), flexShrink: 1, paddingRight: 12 },
  right: { ...type(BODY, 1.25), flexShrink: 0, textAlign: 'right' },
  secondRow: { marginTop: 1.5 },
  honors: { ...type(BODY, 1.25), marginTop: 3 },

  bullets: { marginTop: 4.5 },
  bullet: { flexDirection: 'row', marginBottom: 2.5 },
  dot: { ...type(BODY, 1.32), width: 8.5 },
  bulletText: { ...type(BODY, 1.32), flex: 1 },
});

/** A heading and what's under it. The heading stays on the same page as the first thing in the section. */
function Section({ heading, children }: { heading: string; children: ReactNode }) {
  const [first, ...rest] = Children.toArray(children);
  return (
    <View style={styles.section}>
      <View wrap={false}>
        <Text style={styles.heading}>{heading}</Text>
        {first}
      </View>
      {rest}
    </View>
  );
}

/** The layout jobs, schools, and extra sections share: two rows of left and right text, then bullets. */
function Entry({
  title,
  aside,
  asideBold = true,
  subtitle,
  subAside,
  note,
  bullets = [],
  last,
}: {
  title: string;
  aside?: string;
  asideBold?: boolean;
  subtitle?: string;
  subAside?: string;
  note?: string;
  bullets?: string[];
  last: boolean;
}) {
  const firstRow = title || aside;
  const secondRow = subtitle || subAside;
  return (
    <View style={last ? styles.lastEntry : styles.entry}>
      <View wrap={false}>
        {firstRow ? (
          <View style={styles.row}>
            <Text style={[styles.left, styles.bold]}>{title}</Text>
            <Text style={asideBold ? [styles.right, styles.bold] : styles.right}>{aside}</Text>
          </View>
        ) : null}
        {secondRow ? (
          <View style={firstRow ? [styles.row, styles.secondRow] : styles.row}>
            <Text style={styles.left}>{subtitle}</Text>
            <Text style={styles.right}>{subAside}</Text>
          </View>
        ) : null}
        {note ? <Text style={styles.honors}>{note}</Text> : null}
      </View>
      {bullets.length > 0 && (
        <View style={styles.bullets}>
          {bullets.map((bullet, index) => (
            <View key={index} style={styles.bullet} wrap={false}>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function Classic({ content: raw, pageSize }: TemplateProps) {
  const content = tidy(raw);
  const contact = [content.title, content.location, content.phone, content.email, ...content.links]
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <Document
      title={[content.name, content.title].filter(Boolean).join(' - ') || 'Resume'}
      author={content.name || undefined}
      creator="Onward"
      producer="Onward"
    >
      <Page size={PAGE_SIZE_NAMES[pageSize]} style={styles.page}>
        {content.name.trim() ? <Text style={styles.name}>{content.name.trim()}</Text> : null}
        {contact.length > 0 && (
          <Text style={styles.contact}>
            {contact.map((part, index) => {
              const target = linkTarget(part);
              return (
                <Text key={index}>
                  {index > 0 ? SEPARATOR : ''}
                  {target ? (
                    <Link src={target} style={styles.link}>
                      {part}
                    </Link>
                  ) : (
                    part
                  )}
                </Text>
              );
            })}
          </Text>
        )}

        {content.summary.trim() ? (
          <Section heading="Professional Summary">
            <Text style={styles.summary}>{content.summary.trim()}</Text>
          </Section>
        ) : null}

        {content.skills.length > 0 && (
          <Section heading="Technical Skills">
            {content.skills.map((group, index) => (
              <Text key={index} style={styles.skillLine}>
                {group.label ? <Text style={styles.bold}>{group.label}:  </Text> : null}
                {group.items.join(' · ')}
              </Text>
            ))}
          </Section>
        )}

        {content.experience.length > 0 && (
          <Section heading="Work Experience">
            {content.experience.map((job, index) => (
              <Entry
                key={index}
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
          <Section heading="Education">
            {content.education.map((school, index) => (
              <Entry
                key={index}
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
          <Section key={sectionIndex} heading={section.heading || 'More'}>
            {section.items.map((item, index) => (
              <Entry
                key={index}
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
