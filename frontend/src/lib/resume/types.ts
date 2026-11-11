import type { ResumePageSize, ResumeTemplate } from '../../gql/graphql';

// The shape of a resume's content. The server checks it (see
// backend/app/models/resume_content.rb), and every template reads it.

export type SkillGroup = { label: string; items: string[] };
export type Job = { title: string; company: string; location: string; start: string; end: string; bullets: string[] };
export type School = { school: string; degree: string; date: string; honors: string };
export type SectionItem = { title: string; subtitle: string; date: string; bullets: string[] };
export type ExtraSection = { heading: string; items: SectionItem[] };

export type ResumeContent = {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  links: string[];
  summary: string;
  skills: SkillGroup[];
  experience: Job[];
  education: School[];
  sections: ExtraSection[];
};

export const EMPTY_JOB: Job = { title: '', company: '', location: '', start: '', end: '', bullets: [] };
export const EMPTY_SCHOOL: School = { school: '', degree: '', date: '', honors: '' };
export const EMPTY_SKILL_GROUP: SkillGroup = { label: '', items: [] };
export const EMPTY_SECTION_ITEM: SectionItem = { title: '', subtitle: '', date: '', bullets: [] };
export const EMPTY_SECTION: ExtraSection = { heading: '', items: [{ ...EMPTY_SECTION_ITEM }] };

type Loose = Record<string, unknown>;

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const texts = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []);
const objects = (value: unknown): Loose[] =>
  Array.isArray(value) ? value.filter((item): item is Loose => typeof item === 'object' && item !== null) : [];

/** Content arrives from the API as plain JSON. This fills in anything missing, so the rest of the app can trust the shape. */
export function toResumeContent(value: unknown): ResumeContent {
  const data: Loose = typeof value === 'object' && value !== null ? (value as Loose) : {};
  return {
    name: text(data.name),
    title: text(data.title),
    location: text(data.location),
    phone: text(data.phone),
    email: text(data.email),
    links: texts(data.links),
    summary: text(data.summary),
    skills: objects(data.skills).map((group) => ({ label: text(group.label), items: texts(group.items) })),
    experience: objects(data.experience).map((job) => ({
      title: text(job.title),
      company: text(job.company),
      location: text(job.location),
      start: text(job.start),
      end: text(job.end),
      bullets: texts(job.bullets),
    })),
    education: objects(data.education).map((school) => ({
      school: text(school.school),
      degree: text(school.degree),
      date: text(school.date),
      honors: text(school.honors),
    })),
    sections: objects(data.sections).map((section) => ({
      heading: text(section.heading),
      items: objects(section.items).map((item) => ({
        title: text(item.title),
        subtitle: text(item.subtitle),
        date: text(item.date),
        bullets: texts(item.bullets),
      })),
    })),
  };
}

/** The templates you can pick. Adding one: add it here, in resume-pdf/templates, and in the backend's Resume::TEMPLATES. */
export const TEMPLATES: readonly { id: ResumeTemplate; label: string }[] = [{ id: 'CLASSIC', label: 'Classic' }];

export const PAGE_SIZES: readonly { id: ResumePageSize; label: string }[] = [
  { id: 'LETTER', label: 'Letter (Canada and US)' },
  { id: 'A4', label: 'A4' },
];

const fileSafe = (text: string) => text.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * A file name for the PDF. A resume tailored for an application is named for
 * the job, like "Frontend Developer Brightline resume.pdf". A base resume is
 * named for the person, like "Dana Whitfield - Frontend v3.pdf".
 */
export function pdfFileName(
  content: ResumeContent,
  title: string,
  application?: { role: string; company: string } | null,
): string {
  if (application) {
    return `${fileSafe([application.role, application.company, 'resume'].map(fileSafe).filter(Boolean).join(' '))}.pdf`;
  }
  const name = [content.name, title].map((part) => part.trim()).filter(Boolean).join(' - ') || 'Resume';
  return `${fileSafe(name)}.pdf`;
}
