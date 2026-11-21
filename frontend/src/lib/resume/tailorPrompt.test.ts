import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TAILOR_INSTRUCTIONS,
  instructionsToSave,
  tailorInstructions,
  tailorMessage,
  wordCount,
  type TailorJob,
} from './tailorPrompt';

const resume = {
  name: 'Dana Whitfield',
  title: 'Frontend Developer',
  email: 'dana@example.com',
  experience: [{ title: 'Frontend Developer', company: 'Tidewater Apps', start: '2022-08', end: 'Present', bullets: ['Rebuilt the booking flow.'] }],
};

const job: TailorJob = {
  company: 'Brightline',
  role: 'Senior Frontend Developer',
  location: 'Toronto, ON',
  workArrangement: 'HYBRID',
  jobDescription: '  We need someone who loves design systems and accessibility.\n\nYou will own our React component library.  ',
};

/** The resume JSON inside the message's code block. */
function resumeIn(message: string) {
  const json = message.match(/My resume, as JSON:\n```json\n([\s\S]*?)\n```/)?.[1];
  return JSON.parse(json ?? 'null');
}

describe('tailorMessage', () => {
  it('has the job and its whole description', () => {
    const message = tailorMessage(resume, job);
    expect(message).toContain('The job: Senior Frontend Developer at Brightline');
    expect(message).toContain('Location: Toronto, ON, Hybrid');
    expect(message).toContain(
      '"""\nWe need someone who loves design systems and accessibility.\n\nYou will own our React component library.\n"""',
    );
  });

  it('has the base resume as complete JSON, every key filled in, ready to come back the same shape', () => {
    const sent = resumeIn(tailorMessage(resume, job));
    expect(sent.name).toBe('Dana Whitfield');
    expect(sent.experience[0].bullets).toEqual(['Rebuilt the booking flow.']);
    expect(Object.keys(sent)).toEqual([
      'name', 'title', 'location', 'phone', 'email', 'links', 'summary', 'skills', 'experience', 'education', 'sections',
    ]);
    expect(sent.phone).toBe('');
  });

  it('asks for JSON only, and for nothing made up', () => {
    const message = tailorMessage(resume, job);
    expect(message).toMatch(/Return exactly one fenced code block containing valid JSON/);
    expect(message).toMatch(/Don't invent responsibilities, achievements, metrics, credentials, or work history/);
    expect(message).toMatch(/Keep my name, contact details/);
    // Onward adds the job and the resume itself, so the instructions have no placeholders for them.
    expect(message).not.toContain('[Insert');
  });

  it('leaves out the location line when there is no location', () => {
    const message = tailorMessage(resume, { ...job, location: '  ', workArrangement: null });
    expect(message).not.toContain('Location:');
  });

  it('asks for another pass when re-tailoring', () => {
    const message = tailorMessage(resume, job, { again: true });
    expect(message).toMatch(/^My resume below is already tailored for this job/);
    expect(message).toContain(DEFAULT_TAILOR_INSTRUCTIONS);
    expect(resumeIn(message).name).toBe('Dana Whitfield');
  });

  it('starts with your own instructions, and still has the job and the resume after them', () => {
    const message = tailorMessage(resume, job, { instructions: '  Keep it to two bullets per role.\n' });
    expect(message).toMatch(/^Keep it to two bullets per role\.\n\nThe job: Senior Frontend Developer at Brightline/);
    expect(message).not.toContain('Preserve the scope');
    expect(resumeIn(message).name).toBe('Dana Whitfield');
  });

  it("falls back to Onward's instructions when yours are empty", () => {
    expect(tailorMessage(resume, job, { instructions: '   ' })).toMatch(/^Tailor my resume for the job description below/);
  });
});

describe('tailorInstructions and instructionsToSave', () => {
  it("uses Onward's instructions until you save your own", () => {
    expect(tailorInstructions(null)).toBe(DEFAULT_TAILOR_INSTRUCTIONS);
    expect(tailorInstructions('  ')).toBe(DEFAULT_TAILOR_INSTRUCTIONS);
    expect(tailorInstructions(' Mine ')).toBe('Mine');
  });

  it("saves nothing for Onward's own instructions, so a better default reaches you later", () => {
    expect(instructionsToSave(`${DEFAULT_TAILOR_INSTRUCTIONS}\n`)).toBeNull();
    expect(instructionsToSave('')).toBeNull();
    expect(instructionsToSave(' Mine\n')).toBe('Mine');
  });
});

describe('wordCount', () => {
  it('counts words', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount('   ')).toBe(0);
    expect(wordCount(' Own the  component\nlibrary. ')).toBe(4);
  });
});
