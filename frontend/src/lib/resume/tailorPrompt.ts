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

/**
 * Onward's own instructions at the top of the message. You can change them
 * before copying, and save your version as your default (it's kept on your
 * account as `tailorInstructions`). The job and the resume always follow.
 */
export const DEFAULT_TAILOR_INSTRUCTIONS = `Tailor my resume for the job below. Reply with only one code block containing the tailored resume as JSON,
in exactly the same shape as mine (the same keys), and no other text. My job-search app, Onward, reads it.

How to tailor it:
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

/** Your saved instructions, or Onward's when you haven't saved any. */
export function tailorInstructions(saved: string | null | undefined) {
  return saved?.trim() ? saved.trim() : DEFAULT_TAILOR_INSTRUCTIONS;
}

/** What to save for these instructions: null when they're Onward's own, so later changes to the default reach you. */
export function instructionsToSave(instructions: string) {
  const trimmed = instructions.trim();
  return trimmed === '' || trimmed === DEFAULT_TAILOR_INSTRUCTIONS ? null : trimmed;
}

/**
 * What "Copy message for ChatGPT" copies on an application's page: the
 * instructions, then the job and the base resume as Onward's JSON.
 * ChatGPT's reply goes back into Onward as the tailored resume.
 *
 * With `again`, the resume is the one already tailored for this job, and the
 * reply replaces its content ("Re-tailor"), so the message says so first.
 */
export function tailorMessage(
  resumeContent: unknown,
  job: TailorJob,
  { again = false, instructions = DEFAULT_TAILOR_INSTRUCTIONS }: { again?: boolean; instructions?: string } = {},
) {
  const resume = JSON.stringify(toResumeContent(resumeContent), null, 2);
  const another = again
    ? 'My resume below is already tailored for this job. Give it another pass to make it fit even better.\n\n'
    : '';

  return `${another}${tailorInstructions(instructions)}

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
