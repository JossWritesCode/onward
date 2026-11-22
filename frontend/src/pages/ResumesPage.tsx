import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router';
import type { ResumesQuery as ResumesQueryData } from '../gql/graphql';
import {
  DeleteResumeMutation,
  DuplicateResumeMutation,
  JobApplicationsQuery,
  ResumesQuery,
} from '../graphql/operations';
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
          icon={<FileTextIcon strokeWidth={1.5} />}
          title="Make your first resume"
          body="Onward gives you a prompt for any AI chat. Paste back what it writes, and you get a resume you can edit and download."
          action={newButton}
        />
      )}

      {resumes.length > 0 && (
        <div className="space-y-10">
          <section aria-labelledby="base-heading">
            <h2 id="base-heading" className="text-[22px]/7 font-semibold">
              Base resumes
            </h2>
            <p className="mt-1 mb-4 text-muted">Your starting points. Tailor one to copy it for a job.</p>
            {bases.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2">{bases.map(card)}</ul>
            ) : (
              <Card className="p-5 text-muted">
                Every resume here is tailored for a job. Duplicate one to keep a general version.
              </Card>
            )}
          </section>

          {tailored.length > 0 && (
            <section aria-labelledby="tailored-heading">
              <h2 id="tailored-heading" className="text-[22px]/7 font-semibold">
                Tailored for a job
              </h2>
              <p className="mt-1 mb-4 text-muted">
                Each one belongs to an application, and shows on its card.
              </p>
              <ul className="grid gap-4 sm:grid-cols-2">{tailored.map(card)}</ul>
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
}: {
  resume: Resume;
  busy: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const content = toResumeContent(resume.content);
  const who = [content.name, content.title].filter(Boolean).join(' · ');
  const template = TEMPLATES.find((option) => option.id === resume.template)?.label ?? resume.template;
  const application = resume.jobApplication;

  return (
    <Card className="flex h-full flex-col p-5 transition hover:border-control">
      <Link
        to={`/resumes/${resume.id}`}
        className="group -m-1 flex min-w-0 flex-1 items-start gap-3 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-link"
      >
        <FileTextIcon className="mt-0.5 shrink-0 text-[28px] text-muted" strokeWidth={1.5} />
        <span className="min-w-0">
          {/* Two lines, so similar names like "Frontend, product teams" and "Frontend, design teams" stay apart. */}
          <span className="line-clamp-2 text-lg/6 font-semibold break-words group-hover:text-link" title={resume.title}>
            {resume.title}
          </span>
          {who && <span className="mt-1 block truncate text-muted">{who}</span>}
          <span className="mt-0.5 block text-[13px]/[18px] text-muted">
            {template} · {resume.pageSize === 'A4' ? 'A4' : 'Letter'} · edited {editedOn(resume.updatedAt)}
          </span>
        </span>
      </Link>

      {application && (
        <Link
          to={`/applications/${application.id}`}
          className="mt-3 inline-flex max-w-full items-center gap-1.5 self-start rounded-md px-1 py-0.5 text-sm/5 font-medium text-link hover:underline focus-visible:outline-2 focus-visible:outline-link"
        >
          <BriefcaseIcon className="shrink-0" />
          <span className="truncate">
            {application.company} · {application.role}
          </span>
        </Link>
      )}

      {picking ? (
        <TailorPicker resume={resume} onClose={() => setPicking(false)} />
      ) : (
        <div className="-mx-2 mt-4 flex flex-wrap items-center gap-1 border-t border-line px-2 pt-3">
          {!application && (
            <Button variant="ghost" disabled={busy} onClick={() => setPicking(true)}>
              <SparklesIcon /> Tailor for…
            </Button>
          )}
          <Button variant="ghost" disabled={busy} onClick={onDuplicate}>
            <CopyIcon /> Duplicate
          </Button>
          {/* Quiet until you point at it or tab to it, then clearly a delete. */}
          <Button
            variant="ghost"
            className="ml-auto hover:bg-rose-50! hover:text-rose-700! focus-visible:bg-rose-50 focus-visible:text-rose-700 focus-visible:outline-rose-600 dark:hover:bg-rose-950/40! dark:hover:text-rose-400! dark:focus-visible:bg-rose-950/40 dark:focus-visible:text-rose-400"
            disabled={busy}
            onClick={onDelete}
          >
            <TrashIcon /> Delete
          </Button>
        </div>
      )}
    </Card>
  );
}

/**
 * Picks the application to tailor a base resume for, then goes to its page,
 * where the Resume section does the tailoring with this resume picked.
 */
function TailorPicker({ resume, onClose }: { resume: Resume; onClose: () => void }) {
  const navigate = useNavigate();
  const { data, loading } = useQuery(JobApplicationsQuery);
  const [applicationId, setApplicationId] = useState('');
  const applications = data?.jobApplications ?? [];
  const free = applications.filter((application) => !application.resume);

  function tailor() {
    if (!applicationId) return;
    navigate(`/applications/${applicationId}?tailor=${resume.id}`);
  }

  return (
    <div className="mt-4 space-y-2 border-t border-line pt-3">
      <label htmlFor={`tailor-${resume.id}`} className="block text-sm/5 font-semibold">
        Tailor a copy for which application?
      </label>
      {!loading && free.length === 0 ? (
        <p className="text-sm/5 text-muted">
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
        <Button onClick={tailor} disabled={!applicationId}>
          Tailor
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
