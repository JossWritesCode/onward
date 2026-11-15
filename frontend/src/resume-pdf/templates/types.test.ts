import { describe, expect, it } from 'vitest';
import { pdfFileName, toResumeContent, type ResumeContent } from '../../lib/resume/types';
import { contactParts, documentMeta, linkTarget, tidy } from './types';

const content = (overrides: Partial<ResumeContent> = {}): ResumeContent => ({ ...toResumeContent({}), ...overrides });

describe('contactParts', () => {
  it('lists headline, location, phone, email, then links, in that order', () => {
    const parts = contactParts(
      content({ title: 'Engineer', location: 'Toronto', phone: '555 0100', email: 'a@b.co', links: ['github.com/a', 'a.dev'] }),
    );
    expect(parts).toEqual(['Engineer', 'Toronto', '555 0100', 'a@b.co', 'github.com/a', 'a.dev']);
  });

  it('skips blanks and trims', () => {
    expect(contactParts(content({ title: '  ', email: ' a@b.co ', links: ['', '  '] }))).toEqual(['a@b.co']);
  });
});

describe('tidy', () => {
  it('drops blank bullets, links, and skill items', () => {
    const tidied = tidy(
      content({
        links: ['github.com/a', '  '],
        skills: [{ label: 'Languages', items: ['Ruby', ' ', 'TypeScript'] }],
        experience: [{ title: 'Dev', company: 'Acme', location: '', start: '2020-01', end: '', bullets: ['Shipped', '', '  '] }],
      }),
    );
    expect(tidied.links).toEqual(['github.com/a']);
    expect(tidied.skills[0].items).toEqual(['Ruby', 'TypeScript']);
    expect(tidied.experience[0].bullets).toEqual(['Shipped']);
  });

  it('drops half-typed, empty entries so templates never draw an empty row', () => {
    const tidied = tidy(
      content({
        skills: [{ label: ' ', items: [' '] }],
        experience: [{ title: '', company: '', location: '', start: '', end: '', bullets: [' '] }],
        education: [{ school: ' ', degree: '', date: '', honors: '' }],
        sections: [{ heading: 'Projects', items: [{ title: '', subtitle: '', date: '', bullets: [] }] }],
      }),
    );
    expect(tidied.skills).toEqual([]);
    expect(tidied.experience).toEqual([]);
    expect(tidied.education).toEqual([]);
    expect(tidied.sections).toEqual([]);
  });

  it('keeps an entry that only has bullets', () => {
    const tidied = tidy(content({ experience: [{ title: '', company: '', location: '', start: '', end: '', bullets: ['Did a thing'] }] }));
    expect(tidied.experience).toHaveLength(1);
  });

  it('keeps a skill group with a label and no items', () => {
    expect(tidy(content({ skills: [{ label: 'Languages', items: [] }] })).skills).toHaveLength(1);
  });
});

describe('linkTarget', () => {
  it.each([
    ['a@b.co', 'mailto:a@b.co'],
    ['https://a.dev', 'https://a.dev'],
    ['HTTP://A.DEV/x', 'HTTP://A.DEV/x'],
    ['github.com/josswritescode', 'https://github.com/josswritescode'],
    ['linkedin.com/in/someone', 'https://linkedin.com/in/someone'],
    ['  a.dev  ', 'https://a.dev'],
  ])('"%s" opens %s', (text, href) => {
    expect(linkTarget(text)).toBe(href);
  });

  it.each(['+1 416 555 0100', 'Toronto, ON, Canada', 'Software Engineer', ''])('"%s" is plain text', (text) => {
    expect(linkTarget(text)).toBeNull();
  });
});

describe('documentMeta', () => {
  it('titles the PDF with the name and headline', () => {
    expect(documentMeta(content({ name: 'Dana', title: 'Engineer' }))).toMatchObject({ title: 'Dana - Engineer', author: 'Dana' });
  });

  it('falls back to "Resume" with no author', () => {
    expect(documentMeta(content())).toMatchObject({ title: 'Resume', author: undefined });
  });
});

describe('pdfFileName', () => {
  it('names a tailored resume for the job', () => {
    expect(pdfFileName(content({ name: 'Dana' }), 'Frontend v3', { role: 'Frontend Developer', company: 'Brightline' })).toBe(
      'Frontend Developer Brightline resume.pdf',
    );
  });

  it('names a base resume for the person and the resume', () => {
    expect(pdfFileName(content({ name: 'Dana Whitfield' }), 'Frontend v3')).toBe('Dana Whitfield - Frontend v3.pdf');
  });

  it('removes characters a file name cannot have', () => {
    expect(pdfFileName(content(), '', { role: 'C/C++ Dev: "Senior"', company: 'A|B' })).toBe('C C++ Dev Senior A B resume.pdf');
  });

  it('falls back to Resume.pdf', () => {
    expect(pdfFileName(content(), '  ')).toBe('Resume.pdf');
  });
});

describe('toResumeContent', () => {
  it('fills in everything missing, so the rest of the app can trust the shape', () => {
    expect(toResumeContent(null)).toEqual(content());
    expect(toResumeContent({ name: 7, links: ['a', 3, null], experience: [null, { title: 'Dev' }] })).toMatchObject({
      name: '',
      links: ['a'],
      experience: [{ title: 'Dev', company: '', bullets: [] }],
    });
  });
});
