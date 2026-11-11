import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ImportResumeMutation, JobApplicationsQuery } from '../graphql/operations';
import { showNewResumeToast } from '../lib/resume/newResumeToast';
import { RESUME_PROMPT } from '../lib/resume/prompt';
import { ArrowLeftIcon, CheckIcon, CopyIcon, SparklesIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Select, Textarea } from '../components/ui';

const STEPS = [
  'Copy the prompt and paste it into any AI chat.',
  'Under it, paste your current resume, or describe what you want it to say.',
  'Copy the JSON it replies with, paste it below, and press Format.',
];

/** The paste screen at /resumes/new. */
export default function ResumeNewPage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  // "Paste it in instead" on an application's page arrives with ?application=ID.
  const [searchParams] = useSearchParams();
  const [applicationId, setApplicationId] = useState(searchParams.get('application') ?? '');
  const { data: applicationsData } = useQuery(JobApplicationsQuery);
  const applications = applicationsData?.jobApplications ?? [];
  const application = applications.find((candidate) => candidate.id === applicationId);
  const [importResume, { loading }] = useMutation(ImportResumeMutation, {
    refetchQueries: ['Resumes', 'Board', 'JobApplications', 'JobApplication'],
  });

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(RESUME_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrors(["Your browser didn't allow copying. Open the prompt below and copy it by hand."]);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    try {
      const result = (await importResume({ variables: { text, jobApplicationId: applicationId || null } })).data?.importResume;
      if (result?.resume) {
        navigate(`/resumes/${result.resume.id}`);
        showNewResumeToast(result.filledFields, result.resume.jobApplication);
      } else {
        setErrors(result?.errors.map((error) => error.message) ?? ['Something went wrong. Try again.']);
      }
    } catch (caught) {
      setErrors([caught instanceof Error ? caught.message : 'Something went wrong. Try again.']);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/resumes"
        className="mb-4 inline-flex items-center gap-1.5 font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400"
      >
        <ArrowLeftIcon /> Resumes
      </Link>
      <h1 className="text-3xl font-black tracking-tight">New resume</h1>
      <p className="mt-1 mb-6 text-stone-500 dark:text-stone-400">
        Let an AI do the typing. Onward turns what it writes into a resume you can edit and download.
      </p>

      <Card className="mb-5 p-5">
        <ol className="space-y-2">
          {STEPS.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={copyPrompt}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy prompt'}
          </Button>
          <details className="min-w-0 basis-full text-sm">
            <summary className="font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400">See the prompt</summary>
            <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-stone-100 p-3 text-xs whitespace-pre-wrap text-stone-700 dark:bg-stone-800 dark:text-stone-200">
              {RESUME_PROMPT}
            </pre>
          </details>
        </div>
      </Card>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <label htmlFor="resume-json" className="block text-sm font-bold text-stone-700 dark:text-stone-300">
          The AI's reply
        </label>
        <Textarea
          id="resume-json"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={'```json\n{\n  "name": "...",\n  ...\n}\n```'}
          className="font-mono text-sm"
          aria-describedby="resume-json-hint"
        />
        <p id="resume-json-hint" className="-mt-2 text-sm text-stone-500 dark:text-stone-400">
          Paste the whole reply. Code-fence marks, stray commas, and curly quotes are fine.
        </p>

        {applications.length > 0 && (
          <Field
            label="For an application"
            htmlFor="resume-application"
            hint={
              application
                ? `It'll show on the ${application.company} card, and download as "${application.role} ${application.company} resume.pdf".`
                : 'Optional. Pick one if this resume is tailored for a particular job.'
            }
          >
            <Select id="resume-application" value={applicationId} onChange={(event) => setApplicationId(event.target.value)}>
              <option value="">None: this is a base resume</option>
              {applications.map((candidate) => (
                <option key={candidate.id} value={candidate.id} disabled={Boolean(candidate.resume)}>
                  {candidate.company} · {candidate.role}
                  {candidate.resume ? ' (has a resume)' : ''}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <ErrorBanner messages={errors} />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={loading || text.trim() === ''}>
            <SparklesIcon />
            {loading ? 'Formatting…' : 'Format'}
          </Button>
          <Link to="/resumes" className="px-3 py-2 font-bold text-stone-500 hover:text-stone-800 dark:text-stone-400">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
