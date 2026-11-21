import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router';
import type { JobApplicationQuery } from '../../gql/graphql';
import {
  ResumesQuery,
  RetailorResumeMutation,
  TailorInstructionsQuery,
  TailorResumeMutation,
  UpdateJobApplicationMutation,
  UpdateTailorInstructionsMutation,
} from '../../graphql/operations';
import { downloadResumePdf } from '../../lib/resume/download';
import { showRetailoredToast, showTailoredFromReplyToast, showTailoredToast } from '../../lib/resume/newResumeToast';
import {
  DEFAULT_TAILOR_INSTRUCTIONS,
  instructionsToSave,
  tailorInstructions,
  tailorMessage,
  wordCount,
} from '../../lib/resume/tailorPrompt';
import { pdfFileName, toResumeContent } from '../../lib/resume/types';
import { CheckIcon, CopyIcon, DownloadIcon, FileTextIcon, PencilIcon, RefreshIcon, SparklesIcon } from '../icons';
import { Button, ButtonLink, Card, ErrorBanner, Field, Select, Textarea } from '../ui';

type Application = Pick<
  JobApplicationQuery['jobApplication'],
  'id' | 'company' | 'role' | 'location' | 'workArrangement' | 'jobDescription' | 'resume'
>;

type Props = {
  application: Application;
  /** The job description as it is in the form on this page, saved or not. */
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
};

const REFETCH = ['Board', 'Resumes', 'Resume', 'JobApplication', 'JobApplications'];

/**
 * The Resume section on an application's page: the resume tailored for this
 * job, or a way to make one. Tailoring goes through ChatGPT (or any AI chat):
 * copy a message with the base resume and the job description, paste it
 * there, and paste the reply back here.
 *
 * Arriving with ?tailor=<resume id> (from "Tailor for…" on the Resumes page)
 * picks that base resume and scrolls here.
 */
export default function ApplicationResume(props: Props) {
  const [searchParams] = useSearchParams();
  const preferred = searchParams.get('tailor');
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (preferred) section.current?.scrollIntoView({ block: 'start' });
  }, [preferred]);

  return (
    <section ref={section} className="mb-6 scroll-mt-6" aria-labelledby="resume-heading">
      <h2 id="resume-heading" className="mb-3 text-xl font-black">
        Resume
      </h2>
      {props.application.resume ? (
        <LinkedResume {...props} resume={props.application.resume} />
      ) : (
        <TailorOne {...props} preferredBaseId={preferred} />
      )}
    </section>
  );
}

function LinkedResume({
  application,
  resume,
  jobDescription,
  onJobDescriptionChange,
}: Props & { resume: NonNullable<Application['resume']> }) {
  const [working, setWorking] = useState(false);
  const [retailoring, setRetailoring] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const fileName = pdfFileName(toResumeContent(resume.content), resume.title, application);

  async function download() {
    setWorking(true);
    setProblem(null);
    try {
      await downloadResumePdf(resume, application);
    } catch {
      setProblem("We couldn't make the PDF. Open the resume and try from there.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl text-brand-600 dark:bg-brand-900/50 dark:text-brand-300">
          <FileTextIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">{resume.title}</p>
          <p className="text-sm break-words text-stone-500 dark:text-stone-400">Downloads as {fileName}</p>
        </div>
        <ButtonLink variant="secondary" to={`/resumes/${resume.id}`}>
          <PencilIcon /> Open
        </ButtonLink>
        <Button variant="secondary" onClick={download} disabled={working}>
          <DownloadIcon /> {working ? 'Making PDF…' : 'Download PDF'}
        </Button>
        {!retailoring && (
          <Button variant="secondary" onClick={() => setRetailoring(true)}>
            <RefreshIcon /> Re-tailor
          </Button>
        )}
      </div>
      {problem && (
        <div className="mt-3">
          <ErrorBanner messages={[problem]} />
        </div>
      )}
      {retailoring && (
        <Retailor
          application={application}
          resume={resume}
          jobDescription={jobDescription}
          onJobDescriptionChange={onJobDescriptionChange}
          onClose={() => setRetailoring(false)}
        />
      )}
    </Card>
  );
}

function Retailor({
  application,
  resume,
  jobDescription,
  onJobDescriptionChange,
  onClose,
}: Props & { resume: NonNullable<Application['resume']>; onClose: () => void }) {
  const navigate = useNavigate();
  const [retailorResume, { loading }] = useMutation(RetailorResumeMutation, { refetchQueries: REFETCH });

  async function replace(text: string) {
    const result = (await retailorResume({ variables: { id: resume.id, text } })).data?.retailorResume;
    if (!result?.resume) return result?.errors.map((error) => error.message) ?? ['Something went wrong. Try again.'];
    navigate(`/resumes/${result.resume.id}`);
    showRetailoredToast(application);
    return [];
  }

  return (
    <div className="mt-4 space-y-4 border-t-2 border-stone-100 pt-4 dark:border-stone-800">
      <p className="text-stone-600 dark:text-stone-300">
        Give ChatGPT another pass at this resume for {application.company}. Its reply replaces what's in the resume
        now, and the title, template and design stay as they are.
      </p>
      <JobDescription jobDescription={jobDescription} onChange={onJobDescriptionChange} />
      <CopyMessage
        application={application}
        jobDescription={jobDescription}
        message={(instructions) =>
          tailorMessage(resume.content, { ...application, jobDescription }, { again: true, instructions })
        }
      />
      <PasteReply
        id="retailor-reply"
        submitLabel="Replace with this version"
        busyLabel="Replacing…"
        busy={loading}
        onSubmit={replace}
        onCancel={onClose}
      />
    </div>
  );
}

function TailorOne({
  application,
  jobDescription,
  onJobDescriptionChange,
  preferredBaseId,
}: Props & { preferredBaseId: string | null }) {
  const navigate = useNavigate();
  const { data, loading } = useQuery(ResumesQuery);
  const [tailorResume, { loading: tailoring }] = useMutation(TailorResumeMutation, { refetchQueries: REFETCH });
  const [chosen, setChosen] = useState(preferredBaseId ?? '');
  const [problem, setProblem] = useState<string | null>(null);

  // Start from a base resume, not one already shaped for a different job.
  const bases = (data?.resumes ?? []).filter((resume) => !resume.jobApplication);
  const base = bases.find((resume) => resume.id === chosen) ?? bases[0];

  async function tailor(text: string | null) {
    if (!base) return ['Pick a resume to start from.'];
    const result = (await tailorResume({ variables: { id: base.id, jobApplicationId: application.id, text } })).data
      ?.tailorResume;
    if (!result?.resume) return result?.errors.map((error) => error.message) ?? ['Something went wrong. Try again.'];
    navigate(`/resumes/${result.resume.id}`);
    if (text === null) showTailoredToast(application, base.title);
    else showTailoredFromReplyToast(application);
    return [];
  }

  async function copyAsItIs() {
    setProblem(null);
    try {
      const errors = await tailor(null);
      if (errors.length > 0) setProblem(errors.join(' '));
    } catch (caught) {
      setProblem(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
    }
  }

  if (loading && !data) return null;

  if (!base) {
    return (
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <p className="min-w-0 flex-1 text-stone-600 dark:text-stone-300">
          To tailor a resume for this job, start with a base resume: one that isn't for any particular job.
        </p>
        <ButtonLink variant="secondary" to="/resumes/new">
          <SparklesIcon /> New resume
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <p className="text-stone-600 dark:text-stone-300">
        Have ChatGPT tailor one of your base resumes for {application.company}. The tailored copy stays with this
        application, and your base resume doesn't change.
      </p>
      <Field label="Start from" htmlFor="tailor-base">
        <Select id="tailor-base" value={base.id} onChange={(e) => setChosen(e.target.value)}>
          {bases.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.title}
            </option>
          ))}
        </Select>
      </Field>
      <JobDescription jobDescription={jobDescription} onChange={onJobDescriptionChange} />
      <CopyMessage
        application={application}
        jobDescription={jobDescription}
        message={(instructions) => tailorMessage(base.content, { ...application, jobDescription }, { instructions })}
      />
      <PasteReply
        id="tailor-reply"
        submitLabel="Make tailored resume"
        busyLabel="Making it…"
        busy={tailoring}
        onSubmit={tailor}
      />
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Rather do it yourself?{' '}
        <button
          type="button"
          onClick={copyAsItIs}
          disabled={tailoring}
          className="font-bold text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-300"
        >
          Copy it as it is
        </button>{' '}
        and edit it by hand.
      </p>
      {problem && <ErrorBanner messages={[problem]} />}
    </Card>
  );
}

/**
 * The job description going into the message. If the application has none
 * when the section opens, a box to paste it into, which fills the Job
 * description field further down this page too.
 */
function JobDescription({ jobDescription, onChange }: { jobDescription: string; onChange: (text: string) => void }) {
  // Decided once, so the box doesn't vanish as soon as you start typing.
  const [asking] = useState(() => jobDescription.trim() === '');

  if (!asking) {
    const words = wordCount(jobDescription);
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        The message includes this application's job description ({words} {words === 1 ? 'word' : 'words'}). To change
        it, edit Job description below.
      </p>
    );
  }

  return (
    <Field
      label="Paste the job description"
      htmlFor="tailor-job-description"
      hint="Paste it from the job posting. Copying the message saves it with this application."
    >
      <Textarea id="tailor-job-description" rows={6} value={jobDescription} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

type SaveState = { status: 'idle' } | { status: 'saving' } | { status: 'saved' } | { status: 'failed'; message: string };

/**
 * Copies the tailoring message. If the job description in it isn't saved on
 * the application yet, copying saves it too, and says so, or says why it
 * couldn't with a way to try again. The copy never waits on the save.
 *
 * "Edit message" opens the instructions at the top of the message. Edits go
 * into the next copy straight away, and "Save as my default" keeps them for
 * every message after that.
 */
function CopyMessage({
  application,
  jobDescription,
  message,
}: {
  application: Application;
  jobDescription: string;
  /** The whole message, with these instructions at the top. */
  message: (instructions: string) => string;
}) {
  const { data: me } = useQuery(TailorInstructionsQuery);
  const saved = tailorInstructions(me?.me?.tailorInstructions);
  // Null until you type, so it follows your saved instructions as they load.
  const [draft, setDraft] = useState<string | null>(null);
  const instructions = draft ?? saved;
  const [editing, setEditing] = useState(false);
  const [updateApplication] = useMutation(UpdateJobApplicationMutation, { refetchQueries: ['JobApplication'] });
  const [copied, setCopied] = useState(false);
  const [byHand, setByHand] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ status: 'idle' });
  const missing = jobDescription.trim() === '';
  const unsaved = jobDescription.trim() !== (application.jobDescription ?? '').trim();

  async function saveJobDescription() {
    setSave({ status: 'saving' });
    try {
      const result = (await updateApplication({ variables: { id: application.id, input: { jobDescription } } })).data
        ?.updateJobApplication;
      const problems = result?.errors.map((error) => error.message) ?? [];
      if (result?.jobApplication && problems.length === 0) setSave({ status: 'saved' });
      else setSave({ status: 'failed', message: problems.join(' ') || 'Something went wrong.' });
    } catch {
      setSave({ status: 'failed', message: 'Check your connection.' });
    }
  }

  async function copy() {
    setByHand(null);
    // Not awaited: the browser only lets a click copy right away.
    if (unsaved) void saveJobDescription();
    const text = message(instructions);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setByHand(text);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={copy} disabled={missing}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied' : 'Copy message for ChatGPT'}
        </Button>
        {!editing && (
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <PencilIcon /> Edit message
          </Button>
        )}
        <span className="text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
          {missing
            ? 'Add the job description first.'
            : copied
              ? 'Paste it into ChatGPT, then paste its reply below.'
              : 'It has your resume and the job description in it.'}
        </span>
      </div>
      {editing && (
        <EditInstructions
          instructions={instructions}
          saved={saved}
          onChange={setDraft}
          onClose={() => setEditing(false)}
        />
      )}
      {/* Only while it matters: once the description is saved some other way
          (Save changes below), an old failure no longer applies. */}
      {save.status === 'failed' && unsaved && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
        >
          <span className="min-w-0 flex-1">
            We couldn't save the job description: {save.message} The message was still copied.
          </span>
          <Button variant="secondary" onClick={saveJobDescription}>
            Try again
          </Button>
        </div>
      )}
      {save.status === 'saving' && (
        <p className="text-sm text-stone-500 dark:text-stone-400" role="status">
          Saving the job description…
        </p>
      )}
      {save.status === 'saved' && !unsaved && (
        <p className="text-sm text-stone-500 dark:text-stone-400" role="status">
          Job description saved with this application.
        </p>
      )}
      {byHand && (
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Your browser didn't allow copying. Select the message and copy it yourself:
          </p>
          <Textarea
            readOnly
            rows={8}
            value={byHand}
            aria-label="Message for ChatGPT"
            className="mt-1 font-mono text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}
    </div>
  );
}

type DefaultState = { status: 'idle' } | { status: 'saving' } | { status: 'saved' } | { status: 'failed'; message: string };

/**
 * The instructions at the top of the tailoring message, to change before
 * copying. Your resume and the job always follow them, so they can't be
 * edited away.
 */
function EditInstructions({
  instructions,
  saved,
  onChange,
  onClose,
}: {
  instructions: string;
  /** Your default: what you saved, or Onward's own. */
  saved: string;
  onChange: (instructions: string) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [updateInstructions] = useMutation(UpdateTailorInstructionsMutation);
  const [state, setState] = useState<DefaultState>({ status: 'idle' });
  const unsaved = tailorInstructions(instructions) !== saved;
  const isOnwards = tailorInstructions(instructions) === DEFAULT_TAILOR_INSTRUCTIONS;

  function change(text: string) {
    onChange(text);
    setState({ status: 'idle' });
  }

  async function saveAsDefault() {
    setState({ status: 'saving' });
    try {
      const result = (await updateInstructions({ variables: { instructions: instructionsToSave(instructions) } })).data
        ?.updateTailorInstructions;
      const problems = result?.errors.map((error) => error.message) ?? [];
      if (result?.user && problems.length === 0) setState({ status: 'saved' });
      else setState({ status: 'failed', message: problems.join(' ') || 'Something went wrong. Try again.' });
    } catch {
      setState({ status: 'failed', message: "We couldn't save them. Check your connection and try again." });
    }
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-stone-100 p-3 dark:border-stone-800">
      <Field
        label="Instructions for ChatGPT"
        htmlFor={id}
        hint="The job, its description, and your resume are added after these. Changes go into your next copy."
      >
        <Textarea
          id={id}
          rows={14}
          value={instructions}
          onChange={(event) => change(event.target.value)}
          className="font-mono text-sm"
        />
      </Field>
      {state.status === 'failed' && <ErrorBanner messages={[state.message]} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={saveAsDefault} disabled={!unsaved || state.status === 'saving'}>
          {state.status === 'saved' ? <CheckIcon /> : null}
          {state.status === 'saving' ? 'Saving…' : state.status === 'saved' ? 'Saved' : 'Save as my default'}
        </Button>
        {!isOnwards && (
          <Button variant="ghost" onClick={() => change(DEFAULT_TAILOR_INSTRUCTIONS)}>
            <RefreshIcon /> Use Onward's default
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
        <span className="text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
          {state.status === 'saved'
            ? 'Every new message starts with these instructions.'
            : unsaved
              ? 'Not saved as your default yet.'
              : ''}
        </span>
      </div>
    </div>
  );
}

/** Where ChatGPT's reply goes. `onSubmit` returns the problems, if any. */
function PasteReply({
  id,
  submitLabel,
  busyLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  id: string;
  submitLabel: string;
  busyLabel: string;
  busy: boolean;
  onSubmit: (text: string) => Promise<string[]>;
  onCancel?: () => void;
}) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    try {
      setErrors(await onSubmit(text));
    } catch (caught) {
      setErrors([caught instanceof Error ? caught.message : 'Something went wrong. Try again.']);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <Field
        label="ChatGPT's reply"
        htmlFor={id}
        hint="Paste the whole reply. Code-fence marks, stray commas, and curly quotes are fine."
      >
        <Textarea
          id={id}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={'```json\n{\n  "name": "...",\n  ...\n}\n```'}
          className="font-mono text-sm"
        />
      </Field>
      <ErrorBanner messages={errors} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || text.trim() === ''}>
          <SparklesIcon /> {busy ? busyLabel : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
