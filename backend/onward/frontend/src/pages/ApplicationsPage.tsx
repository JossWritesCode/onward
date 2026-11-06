import type { ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { BoardQuery } from '../graphql/operations';
import { useView } from '../lib/preferences';
import ApplicationList from '../components/ApplicationList';
import Board from '../components/Board';
import QuoteBanner from '../components/QuoteBanner';
import { BoardIcon, BriefcaseIcon, ColumnsIcon, ListIcon, PlusIcon, SparklesIcon } from '../components/icons';
import { ButtonLink, EmptyState, ErrorBanner, PageHeader, Spinner } from '../components/ui';

export default function ApplicationsPage() {
  const { data, loading, error } = useQuery(BoardQuery);
  const [view, setView] = useView();

  const stages = data?.stages ?? [];
  const total = stages.reduce((sum, stage) => sum + stage.jobApplications.length, 0);
  const interviewing = stages
    .filter((stage) => stage.kind === 'INTERVIEWING')
    .reduce((sum, stage) => sum + stage.jobApplications.length, 0);

  const addButton = (
    <ButtonLink to="/applications/new">
      <PlusIcon />
      Add application
    </ButtonLink>
  );
  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <ButtonLink to="/progress" variant="secondary">
        <SparklesIcon />
        Log a win
      </ButtonLink>
      {addButton}
    </div>
  );

  return (
    <>
      <QuoteBanner />

      <PageHeader
        title="Your job hunt"
        subtitle={
          total > 0
            ? `${total} ${total === 1 ? 'application' : 'applications'} tracked, ${interviewing} interviewing`
            : 'Everything you apply to, all in one place.'
        }
        action={total > 0 ? headerActions : undefined}
      />

      {error && <ErrorBanner messages={[error.message]} />}
      {loading && !data && <Spinner />}

      {data && total === 0 && (
        <EmptyState
          icon={<BriefcaseIcon />}
          title="Log your first application"
          body="Add a job you've applied to, or one you're saving for later. Every one you log is a step forward."
          action={addButton}
        />
      )}

      {data && total > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="View"
              className="inline-flex rounded-xl border-2 border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-900"
            >
              <ViewButton active={view === 'board'} onClick={() => setView('board')} icon={<BoardIcon />} label="Board" />
              <ViewButton active={view === 'list'} onClick={() => setView('list')} icon={<ListIcon />} label="List" />
            </div>
            {view === 'board' && (
              <p className="hidden text-sm text-stone-500 md:block dark:text-stone-400">
                Drag cards between columns to update them.
              </p>
            )}
            {view === 'board' && (
              <p className="text-sm text-stone-500 md:hidden dark:text-stone-400">Press and hold a card to move it.</p>
            )}
            {view === 'list' && (
              <ButtonLink to="/columns" variant="ghost" className="text-sm">
                <ColumnsIcon /> Edit columns
              </ButtonLink>
            )}
          </div>

          {view === 'board' ? <Board stages={stages} /> : <ApplicationList stages={stages} />}
        </>
      )}
    </>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-extrabold transition ${
        active
          ? 'bg-brand-500 text-white'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
