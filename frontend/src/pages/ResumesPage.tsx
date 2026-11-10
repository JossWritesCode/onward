import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router';
import { DeleteResumeMutation, DuplicateResumeMutation, ResumesQuery } from '../graphql/operations';
import { PAGE_SIZES, TEMPLATES, toResumeContent } from '../lib/resume/types';
import { CopyIcon, FileTextIcon, PlusIcon, TrashIcon } from '../components/icons';
import { Button, ButtonLink, Card, EmptyState, ErrorBanner, PageHeader, Spinner } from '../components/ui';

function editedOn(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ResumesPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(ResumesQuery);
  const [duplicateResume] = useMutation(DuplicateResumeMutation, { refetchQueries: ['Resumes'] });
  const [deleteResume] = useMutation(DeleteResumeMutation, { refetchQueries: ['Resumes'] });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const resumes = data?.resumes ?? [];

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

  const duplicate = (id: string) =>
    run(id, async () => {
      const result = await duplicateResume({ variables: { id } });
      const copy = result.data?.duplicateResume.resume;
      if (copy) navigate(`/resumes/${copy.id}`);
    });

  const remove = (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    void run(id, async () => {
      await deleteResume({ variables: { id } });
    });
  };

  const newButton = (
    <ButtonLink to="/resumes/new">
      <PlusIcon />
      New resume
    </ButtonLink>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Your resumes"
        subtitle={
          resumes.length > 0
            ? 'One for every kind of role. Duplicate one to tailor it.'
            : 'Paste in what an AI formatted for you, tidy it up, and download a clean PDF.'
        }
        action={resumes.length > 0 ? newButton : undefined}
      />

      {error && <ErrorBanner messages={[error.message]} />}
      {problem && <ErrorBanner messages={[problem]} />}
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {resumes.map((resume) => {
            const content = toResumeContent(resume.content);
            const who = [content.name, content.title].filter(Boolean).join(' · ');
            const template = TEMPLATES.find((option) => option.id === resume.template)?.label ?? resume.template;
            const pageSize = PAGE_SIZES.find((option) => option.id === resume.pageSize)?.id === 'A4' ? 'A4' : 'Letter';
            return (
              <li key={resume.id}>
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
                        {template} · {pageSize} · edited {editedOn(resume.updatedAt)}
                      </span>
                    </span>
                  </Link>
                  <div className="mt-3 flex items-center gap-1 border-t-2 border-stone-100 pt-2 dark:border-stone-800">
                    <Button variant="ghost" disabled={busyId === resume.id} onClick={() => duplicate(resume.id)}>
                      <CopyIcon /> Duplicate
                    </Button>
                    <Button
                      variant="ghostDanger"
                      className="ml-auto"
                      disabled={busyId === resume.id}
                      onClick={() => remove(resume.id, resume.title)}
                    >
                      <TrashIcon /> Delete
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
