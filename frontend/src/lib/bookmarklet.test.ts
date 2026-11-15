import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { bookmarkletHref, importedJobFromHash, postingKey, type ImportedJob } from './bookmarklet';

const ONWARD = 'https://onward.example';

/**
 * Clicks the real bookmark on a job page: loads the page at `url`, runs the
 * bookmark's own javascript: code in it, and returns what it would send to
 * Onward. Running the code from the bookmark itself, not the function,
 * also checks that it's self-contained, since a bookmark can't import anything.
 */
function clickBookmark(fixture: string, url: string, extraHtml = ''): { job: ImportedJob; opened: string } {
  const html = readFileSync(new URL(`./__fixtures__/job-pages/${fixture}`, import.meta.url), 'utf8').replace(
    '</body>',
    `${extraHtml}</body>`,
  );
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  let opened = '';
  dom.window.open = ((address: string) => {
    opened = address;
    return {} as Window;
  }) as typeof dom.window.open;

  const href = bookmarkletHref(ONWARD);
  dom.window.eval(decodeURIComponent(href.slice('javascript:'.length)));

  const job = importedJobFromHash(new URL(opened).hash);
  if (!job) throw new Error(`The bookmark opened ${opened}, which has no job in it`);
  return { job, opened };
}

describe('the Save to Onward bookmark', () => {
  it('reads a LinkedIn job, preferring what is on screen over structured data', () => {
    const { job, opened } = clickBookmark('linkedin.html', 'https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4012345678&ref=x');
    expect(opened.startsWith(`${ONWARD}/applications/new#import=`)).toBe(true);
    expect(job).toMatchObject({
      role: 'Frontend Developer',
      company: 'Brightline',
      location: 'Toronto, ON',
      workArrangement: 'HYBRID',
      salaryRange: '$120K/yr - $150K/yr',
      source: 'linkedin.com',
      // A clean address for the job, without the collection or tracking bits.
      postingUrl: 'https://www.linkedin.com/jobs/view/4012345678/',
    });
    expect(job.jobDescription).toContain('We build accessible web apps.');
  });

  it('finds the LinkedIn job id in a /jobs/view/ address with a slug', () => {
    const { job } = clickBookmark('linkedin.html', 'https://www.linkedin.com/jobs/view/frontend-developer-at-brightline-4012345678/');
    expect(job.postingUrl).toBe('https://www.linkedin.com/jobs/view/4012345678/');
  });

  it('reads an Indeed job', () => {
    const { job } = clickBookmark('indeed.html', 'https://ca.indeed.com/viewjob?jk=abc123&from=serp');
    expect(job).toMatchObject({
      role: 'UI Engineer',
      company: 'Copperleaf',
      location: 'Vancouver, BC',
      workArrangement: 'REMOTE',
      salaryRange: '$45 - $55 an hour',
      jobDescription: 'Help us build tools for utilities.',
      source: 'ca.indeed.com',
      postingUrl: 'https://ca.indeed.com/viewjob?jk=abc123',
    });
  });

  it('reads structured data on a company careers page, skipping broken JSON', () => {
    const { job } = clickBookmark('careers-structured.html', 'https://careers.northwind.example/jobs/42?utm_source=x');
    expect(job).toMatchObject({
      role: 'Full Stack Engineer',
      company: 'Northwind Labs',
      location: 'Halifax, NS, CA · Toronto, ON, CA',
      workArrangement: 'REMOTE',
      postingUrl: 'https://careers.northwind.example/jobs/42',
      source: 'careers.northwind.example',
    });
    expect(job.salaryRange).toMatch(/^CAD 90,000–110,000 per year$/);
  });

  it('turns an HTML description, escaped twice, into readable text', () => {
    const { job } = clickBookmark('careers-structured.html', 'https://careers.northwind.example/jobs/42');
    expect(job.jobDescription).toBe('Join us & build things.\n\n• Rails\n• React');
  });

  it('keeps bullets single-spaced when each one is wrapped in a paragraph', () => {
    const posting = {
      '@type': 'JobPosting',
      title: 'Engineer',
      description: '<p>What you will do:</p><ul><li><p>Ship features</p></li><li><p>Review code</p></li></ul><p>Benefits</p>',
    };
    const script = `<script type="application/ld+json">${JSON.stringify(posting)}</script>`;
    const { job } = clickBookmark('bare.html', 'https://acme.example/careers/123', script);
    expect(job.jobDescription).toBe('What you will do:\n\n• Ship features\n• Review code\n\nBenefits');
  });

  it('falls back to the page title when there is nothing else to go on', () => {
    const { job } = clickBookmark('bare.html', 'https://acme.example/careers/123');
    expect(job).toEqual({ source: 'acme.example', postingUrl: 'https://acme.example/careers/123', role: 'Senior Engineer' });
  });

  it('cuts a huge description to 20,000 characters', () => {
    const posting = { '@type': 'JobPosting', title: 'Engineer', description: 'x'.repeat(25_000) };
    const script = `<script type="application/ld+json">${JSON.stringify(posting)}</script>`;
    const { job } = clickBookmark('bare.html', 'https://acme.example/careers/123', script);
    expect(job.jobDescription).toHaveLength(20_000);
  });

  it('is a javascript: address that carries the Onward address', () => {
    const href = bookmarkletHref(ONWARD);
    expect(href.startsWith('javascript:')).toBe(true);
    expect(decodeURIComponent(href)).toContain(JSON.stringify(ONWARD));
  });
});

describe('importedJobFromHash', () => {
  it('reads the job the bookmark sent', () => {
    const job = { role: 'Engineer', company: 'Acme & Co' };
    expect(importedJobFromHash(`#import=${encodeURIComponent(JSON.stringify(job))}`)).toEqual(job);
  });

  it.each(['', '#', '#other=1', '#import=', '#import=%7Bnot-json', `#import=${encodeURIComponent('"just a string"')}`])(
    'ignores "%s"',
    (hash) => {
      expect(importedJobFromHash(hash)).toBeNull();
    },
  );
});

describe('postingKey', () => {
  it('sees the same LinkedIn job behind different addresses', () => {
    const keys = [
      'https://www.linkedin.com/jobs/view/4012345678/',
      'https://linkedin.com/jobs/view/frontend-developer-at-brightline-4012345678/?trk=abc',
      'https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4012345678',
    ].map(postingKey);
    expect(new Set(keys)).toEqual(new Set(['linkedin:4012345678']));
  });

  it('sees the same Indeed job behind different addresses', () => {
    expect(postingKey('https://ca.indeed.com/viewjob?jk=abc123&from=serp')).toBe('indeed:abc123');
    expect(postingKey('https://www.indeed.com/jobs?q=dev&vjk=abc123')).toBe('indeed:abc123');
  });

  it('ignores the query, a trailing slash, www, and case elsewhere', () => {
    expect(postingKey('https://WWW.Acme.example/Careers/42/?utm_source=x')).toBe('acme.example/careers/42');
    expect(postingKey('https://acme.example/careers/42')).toBe('acme.example/careers/42');
  });

  it('copes with something that is not an address', () => {
    expect(postingKey('  Not A URL ')).toBe('not a url');
    expect(postingKey(null)).toBeNull();
    expect(postingKey('')).toBeNull();
  });
});
