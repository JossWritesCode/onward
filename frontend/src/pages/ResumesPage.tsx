import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router';
import type { ResumesQuery as ResumesQueryData } from '../gql/graphql';
import {
  DeleteResumeMutation,
  DuplicateResumeMutation,
  JobApplicationsQuery,
  ResumesQuery,
  TailorResumeMutation,
} from '../graphql/operations';
import { showTailoredToast } from '../lib/resume/newResumeToast';
import { TEMPLATES, toResumeContent } from '../lib/resume/types';
import { BriefcaseIcon, CopyIcon, FileTextIcon, PlusIcon, SparklesIcon, TrashIcon } from '../components/icons';
import { Button, ButtonLink, Card, EmptyState, ErrorBanner, PageHeader, Select, Spinner } from '../components/ui';

type Resume = ResumesQueryData['resumes'][number];

const REFETCH = ['Resumes', 'Board', 'JobApplications'];

function editedOn(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ResumesPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(ResumesQuery);
  const [duplicateResume] = useMutation(DuplicateResumeMutation, { refetchQueries: REFETCH });
  const [deleteResume] = useMutation(DeleteResumeMutation, { refetchQueries: REFETCH });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const resumes = data?.resumes ?? [];
  const bases = resumes.filter((resume) => !resume.jobApplication);
  const tailored = resumes.filter((resume) => resume.jobApplication);

  async function run(id: string, action: () => Promise<void>) {
    setBusyId(id);
    setProblem(null);
    try {
      await action();
    } catch (caught) {
      setProblem(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  const duplicate = (resume: Resume) =>
    run(resume.id, async () => {
      const result = await duplicateResume({ variables: { id: resume.id } });
      const copy = result.data?.duplicateResume.resume;
      if (copy) navigate(`/resumes/${copy.id}`);
    });

  const remove = (resume: Resume) => {
    if (!window.confirm(`Delete "${resume.title}"? This can't be undone.`)) return;
    void run(resume.id, async () => {
      await deleteResume({ variables: { id: resume.id } });
    });
  };

  const newButton = (
    <ButtonLink to="/resumes/new">
      <PlusIcon />
      New resume
    </ButtonLink>
  );

  const card = (resume: Resume) => (
    <li key={resume.id}>
      <ResumeCard
        resume={resume}
        busy={busyId === resume.id}
        onDuplicate={() => duplicate(resume)}
        onDelete={() => remove(resume)}
        onProblem={setProblem}
      />
    </li>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Your resumes"
        subtitle={
          resumes.length > 0
            ? 'Keep a base resume for each kind of role, and tailor a copy for the jobs that matter.'
            : 'Paste in what an AI formatted for you, tidy it up, and download a clean PDF.'
        }
        action={resumes.length > 0 ? newButton : undefined}
      />

      {error && <ErrorBanner messages={[error.message]} />}
      {problem && (
        <div className="mb-4">
          <ErrorBanner messages={[problem]} />
        </div>
      )}
      {loading && !data && <Spinner />}

      {data && resumes.length === 0 && (
        <EmptyState
          icon={<FileTextIcon />}
          title="Make your first resume"
          body="Onward gives you a prompt for any AI chat. Paste back what it writes, and you get a resume you can edit and download."
          action={newButton}
        />
      )}

      {resumes.length > 0 && (
        <div className="space-y-8">
          <section aria-labelledby="base-heading">
            <h2 id="base-heading" className="text-xl font-black">
              Base resumes
            </h2>
            <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">Your starting points. Tailor one to copy it for a job.</p>
            {bases.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">{bases.map(card)}</ul>
            ) : (
              <Card className="p-4 text-stone-600 dark:text-stone-300">
                Every resume here is tailored for a job. Duplicate one to keep a general version.
              </Card>
            )}
          </section>

          {tailored.length > 0 && (
            <section aria-labelledby="tailored-heading">
              <h2 id="tailored-heading" className="text-xl font-black">
                Tailored for a job
              </h2>
              <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
                Each one belongs to an application, and shows on its card.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">{tailored.map(card)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ResumeCard({
  resume,
  busy,
  onDuplicate,
  onDelete,
  onProblem,
}: {
  resume: Resume;
  busy: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onProblem: (message: string | null) => void;
}) {
  const [picking, setPicking] = useState(false);
  const content = toResumeContent(resume.content);
  const who = [content.name, content.title].filter(Boolean).join(' · ');
  const template = TEMPLATES.find((option) => option.id === resume.template)?.label ?? resume.template;
  const application = resume.jobApplication;

  return (
    <Card className="flex h-full flex-col p-4 transition hover:border-brand-300 dark:hover:border-brand-700">
      <Link to={`/resumes/${resume.id}`} className="group flex min-w-0 flex-1 items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl text-brand-600 dark:bg-brand-900/50 dark:text-brand-300">
          <FileTextIcon />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-lg font-extrabold group-hover:text-brand-600 dark:group-hover:text-brand-300">
            {resume.title}
          </span>
          {who && <span className="block truncate text-stone-600 dark:text-stone-300">{who}</span>}
          <span className="block text-sm text-stone-500 dark:text-stone-400">
            {template} · {resume.pageSize === 'A4' ? 'A4' : 'Letter'} · edited {editedOn(resume.updatedAt)}
          </span>
        </span>
      </Link>

      {application && (
        <Link
          to={`/applications/${application.id}`}
          className="mt-3 inline-flex max-w-full items-center gap-1.5 self-start rounded-full bg-stone-100 px-2.5 py-1 text-sm font-bold text-stone-600 hover:bg-brand-100 hover:text-brand-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-brand-900/50 dark:hover:text-brand-200"
        >
          <BriefcaseIcon className="shrink-0" />
          <span className="truncate">
            {application.company} · {application.role}
          </span>
        </Link>
      )}

      {picking ? (
        <TailorPicker resume={resume} onClose={() => setPicking(false)} onProblem={onProblem} />
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-1 border-t-2 border-stone-100 pt-2 dark:border-stone-800">
          {!application && (
            <Button variant="ghost" disabled={busy} onClick={() => setPicking(true)}>
              <SparklesIcon /> Tailor for…
            </Button>
          )}
          <Button variant="ghost" disabled={busy} onClick={onDuplicate}>
            <CopyIcon /> Duplicate
          </Button>
          <Button variant="ghostDanger" className="ml-auto" disabled={busy} onClick={onDelete}>
            <TrashIcon /> Delete
          </Button>
        </div>
      )}
    </Card>
  );
}

/** Picks the application to tailor a base resume for. */
function TailorPicker({
  resume,
  onClose,
  onProblem,
}: {
  resume: Resume;
  onClose: () => void;
  onProblem: (message: string | null) => void;
}) {
  const navigate = useNavigate();
  const { data, loading } = useQuery(JobApplicationsQuery);
  const [tailorResume, { loading: tailoring }] = useMutation(TailorResumeMutation, { refetchQueries: REFETCH });
  const [applicationId, setApplicationId] = useState('');
  const applications = data?.jobApplications ?? [];
  const free = applications.filter((application) => !application.resume);

  async function tailor() {
    const application = applications.find((candidate) => candidate.id === applicationId);
    if (!application) return;
    onProblem(null);
    try {
      const result = (await tailorResume({ variables: { id: resume.id, jobApplicationId: application.id } })).data?.tailorResume;
      if (result?.resume) {
        navigate(`/resumes/${result.resume.id}`);
        showTailoredToast(application, resume.title);
      } else {
        onProblem(result?.errors.map((error) => error.message).join(' ') || 'Something went wrong. Try again.');
      }
    } catch (caught) {
      onProblem(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t-2 border-stone-100 pt-3 dark:border-stone-800">
      <label htmlFor={`tailor-${resume.id}`} className="block text-sm font-bold text-stone-700 dark:text-stone-300">
        Tailor a copy for which application?
      </label>
      {!loading && free.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {applications.length === 0
            ? 'Add an application to your board first.'
            : 'Every application already has a tailored resume.'}
        </p>
      ) : (
        <Select id={`tailor-${resume.id}`} value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
          <option value="">Pick an application</option>
          {applications.map((application) => (
            <option key={application.id} value={application.id} disabled={Boolean(application.resume)}>
              {application.company} · {application.role}
              {application.resume ? ' (has a resume)' : ''}
            </option>
          ))}
        </Select>
      )}
      <div className="flex items-center gap-2">
        <Button onClick={tailor} disabled={!applicationId || tailoring}>
          {tailoring ? 'Copying…' : 'Tailor'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
