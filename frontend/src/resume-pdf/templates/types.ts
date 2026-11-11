import type { ComponentType } from 'react';
import type { ResumePageSize } from '../../gql/graphql';
import type { ResumeContent } from '../../lib/resume/types';
import type { Theme } from '../theme';

/** What every template is given. A template is a component that returns a react-pdf <Document>. */
export type TemplateProps = { content: ResumeContent; pageSize: ResumePageSize; theme: Theme };
export type Template = ComponentType<TemplateProps>;

/** The fonts templates can use, registered in ../fonts.ts and embedded in the PDF. */
export const FONTS = { serif: 'Neuton', sans: 'Roboto' } as const;

/** The document title and author, from the content. */
export function documentMeta(content: ResumeContent) {
  return {
    title: [content.name, content.title].filter(Boolean).join(' - ') || 'Resume',
    author: content.name || undefined,
    creator: 'Onward',
    producer: 'Onward',
  };
}

/** The contact line: headline, location, phone, email, links. */
export function contactParts(content: ResumeContent): string[] {
  return [content.title, content.location, content.phone, content.email, ...content.links].map((part) => part.trim()).filter(Boolean);
}

export const PAGE_SIZE_NAMES = { LETTER: 'LETTER', A4: 'A4' } as const satisfies Record<ResumePageSize, string>;

const hasText = (value: string) => value.trim().length > 0;

/** Drops blank lines and half-typed entries, so a template never draws an empty row. */
export function tidy(content: ResumeContent): ResumeContent {
  const bullets = (list: string[]) => list.map((bullet) => bullet.trim()).filter(Boolean);
  return {
    ...content,
    links: content.links.map((link) => link.trim()).filter(Boolean),
    skills: content.skills
      .map((group) => ({ label: group.label.trim(), items: group.items.map((item) => item.trim()).filter(Boolean) }))
      .filter((group) => group.label || group.items.length > 0),
    experience: content.experience
      .map((job) => ({ ...job, bullets: bullets(job.bullets) }))
      .filter((job) => [job.title, job.company, job.location, job.start, job.end].some(hasText) || job.bullets.length > 0),
    education: content.education.filter((school) => Object.values(school).some(hasText)),
    sections: content.sections
      .map((section) => ({
        heading: section.heading.trim(),
        items: section.items
          .map((item) => ({ ...item, bullets: bullets(item.bullets) }))
          .filter((item) => [item.title, item.subtitle, item.date].some(hasText) || item.bullets.length > 0),
      }))
      .filter((section) => section.items.length > 0),
  };
}

/** The address a contact detail should open, or null for plain text like a phone number or city. */
export function linkTarget(text: string): string | null {
  const value = text.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(value)) return `https://${value}`;
  return null;
}
