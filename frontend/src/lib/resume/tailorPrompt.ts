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
export const DEFAULT_TAILOR_INSTRUCTIONS = `Tailor my resume for the job description below. Return exactly one fenced code block containing valid JSON, with no text outside it. Preserve the same keys, nesting, and value types as my original resume so Onward can import it.

- Rewrite the top-level "title" and "summary" to highlight my experience most relevant to the role. Keep my actual job titles in the experience section exactly as written.
- Put the most relevant skills groups, skills, and experience bullets first. Use the job description's terminology where it accurately describes my experience.
- You may add a skill that is missing from the skills section if my resume or the "More about me" section below names it or clearly demonstrates it. For example, a bullet about reviewing pull requests supports adding "Code Review," and a bullet about teaching programming supports adding "Technical Instruction."
- Use the job description to decide what to emphasize. Base claims about my experience on my resume and the "More about me" section. Don't add a skill just because it's common for my role or stack. Add a specific tool, platform, methodology, or certification only if I explicitly mention it.
- You may rewrite, split, or combine existing bullets to make relevant work clearer, and write new bullets from the "More about me" section. Preserve the scope of my contribution. Don't invent responsibilities, achievements, metrics, credentials, or work history.
- Aim for one page. Keep about 3 to 5 bullets for recent roles and fewer for older roles. Shorten or drop bullets that add little for this job.
- Keep my name, contact details, links, employers, job titles, schools, degrees, and dates exactly as written.
- Use plain text inside JSON values, with no Markdown formatting or bullet symbols.

More about me (skills and experience that aren't on my resume yet):
- none`;

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
