import type { ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { BoardQuery } from '../graphql/operations';
import { useView } from '../lib/preferences';
import ApplicationList from '../components/ApplicationList';
import Board from '../components/Board';
import QuoteBanner from '../components/QuoteBanner';
import TodayStrip from '../components/today/TodayStrip';
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
    <ButtonLink to="/applications/new" variant="hero">
      <PlusIcon />
      Add application
    </ButtonLink>
  );
  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <ButtonLink to="/progress" variant="outline">
        <SparklesIcon />
        Log a win
      </ButtonLink>
      {addButton}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Your job hunt"
        subtitle={
          total > 0
            ? `${total} ${total === 1 ? 'application' : 'applications'} tracked, ${interviewing} interviewing`
            : 'Everything you apply to, all in one place.'
        }
        action={total > 0 ? headerActions : undefined}
        className="mb-4"
      />

      {/* The quote sits small under the heading, so your applications stay close to the top. */}
      <QuoteBanner />

      <TodayStrip />

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
              className="inline-flex gap-0.5 rounded-xl border border-line bg-surface p-1"
            >
              <ViewButton active={view === 'board'} onClick={() => setView('board')} icon={<BoardIcon />} label="Board" />
              <ViewButton active={view === 'list'} onClick={() => setView('list')} icon={<ListIcon />} label="List" />
            </div>
            {view === 'board' && (
              <p className="hidden text-sm text-muted md:block">
                Drag cards between columns to update them. Drag a column by its grip to reorder it.
              </p>
            )}
            {view === 'board' && (
              <p className="text-sm text-muted md:hidden">Press and hold a card to move it. Reorder columns from “Add or edit columns”.</p>
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
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
        active
          ? 'bg-tint text-tint-ink'
          : 'text-muted hover:bg-stone-100 hover:text-ink dark:hover:bg-night-850'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
