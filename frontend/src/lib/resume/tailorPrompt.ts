import { toResumeContent } from './types';

/** The job a resume is being tailored for, as the application has it. */
export type TailorJob = {
  company: string;
  role: string;
  location?: string | null;
  workArrangement?: 'ONSITE' | 'HYBRID' | 'REMOTE' | null;
  jobDescription: string;
};

const ARRANGEMENTS = { ONSITE: 'On-site', HYBRID: 'Hybrid', REMOTE: 'Remote' } as const;

const RULES = `How to tailor it:
- Lead with what this job asks for. Reword the "title" and "summary" for this role, and order the
  skills groups, and the skills inside them, so the most relevant come first.
- Rewrite bullets in the job description's own words wherever they truthfully fit, and put the most
  relevant bullets first in each role. Shorten or drop bullets that don't help for this job.
- Keep it to one page: about 3 to 5 bullets for recent roles, fewer for older ones.
- Stay truthful. Don't add jobs, employers, degrees, dates, skills, tools, or numbers that aren't in
  my resume. If the job asks for something I don't have, leave it out.
- Keep my name, contact details, links, employers, job titles, schools, and dates exactly as they are.
- Dates as YYYY-MM, or "Present" for a current role.
- Plain text only: no markdown, asterisks, or bullet symbols inside the values.`;

function jobLines(job: TailorJob) {
  const place = [job.location?.trim(), job.workArrangement ? ARRANGEMENTS[job.workArrangement] : null].filter(Boolean);
  return [
    `The job: ${job.role.trim()} at ${job.company.trim()}`,
    ...(place.length > 0 ? [`Location: ${place.join(', ')}`] : []),
    '',
    'Job description:',
    '"""',
    job.jobDescription.trim(),
    '"""',
  ].join('\n');
}

/**
 * What "Copy message for ChatGPT" copies on an application's page: the job,
 * the base resume as Onward's JSON, and how to tailor one to the other.
 * ChatGPT's reply goes back into Onward as the tailored resume.
 *
 * With `again`, the resume is the one already tailored for this job, and the
 * reply replaces its content ("Re-tailor").
 */
export function tailorMessage(resumeContent: unknown, job: TailorJob, { again = false } = {}) {
  const resume = JSON.stringify(toResumeContent(resumeContent), null, 2);
  const opening = again
    ? `My resume below is already tailored for this job. Tailor it further, then reply with only one code block
containing the improved resume as JSON, in exactly the same shape as mine (the same keys), and no other text.`
    : `Tailor my resume for the job below. Reply with only one code block containing the tailored resume as JSON,
in exactly the same shape as mine (the same keys), and no other text. My job-search app, Onward, reads it.`;

  return `${opening}

${RULES}

${jobLines(job)}

My resume, as JSON:
\`\`\`json
${resume}
\`\`\`
`;
}

/** How many words are in a job description, for "312 words". */
export function wordCount(text: string) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}
