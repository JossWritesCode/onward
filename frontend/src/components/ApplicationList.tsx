import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router';
import type { BoardQuery } from '../gql/graphql';
import { MoveJobApplicationMutation } from '../graphql/operations';
import { celebrateMove, showToast } from '../lib/celebrate';
import { formatDate } from '../lib/format';
import { STATUS_STYLES, WORK_ARRANGEMENT_LABELS } from '../lib/status';
import { CalendarIcon, MapPinIcon, UsersIcon } from './icons';
import { Card } from './ui';

type BoardStage = BoardQuery['stages'][number];
type Row = BoardStage['jobApplications'][number] & { stage: BoardStage };

/** Every application in one list, newest activity first. Works well on phones. */
export default function ApplicationList({ stages }: { stages: readonly BoardStage[] }) {
  const [filter, setFilter] = useState<string>('ALL');

  const rows = useMemo<Row[]>(
    () =>
      stages
        .flatMap((stage) => stage.jobApplications.map((application) => ({ ...application, stage })))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [stages],
  );
  const visible = filter === 'ALL' ? rows : rows.filter((row) => row.stage.id === filter);
  const filterStage = stages.find((stage) => stage.id === filter);

  return (
    <>
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter by column">
        <FilterPill label="All" count={rows.length} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
        {stages.map((stage) => (
          <FilterPill
            key={stage.id}
            label={stage.name}
            count={stage.jobApplications.length}
            active={filter === stage.id}
            onClick={() => setFilter(stage.id)}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-stone-500 dark:text-stone-400">
          Nothing in {filterStage?.name ?? 'this column'} right now.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <li key={row.id}>
              <ApplicationRow row={row} stages={stages} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-extrabold transition ${
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-stone-200 bg-white text-stone-600 hover:border-brand-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
      }`}
    >
      {label}
      <span className={active ? 'text-brand-100' : 'text-stone-400'}>{count}</span>
    </button>
  );
}

function ApplicationRow({ row, stages }: { row: Row; stages: readonly BoardStage[] }) {
  const [moveApplication, { loading }] = useMutation(MoveJobApplicationMutation, { refetchQueries: ['Board', 'Streak', 'Progress', 'Today'] });
  const applied = formatDate(row.dateApplied);
  const where = [row.location, row.workArrangement ? WORK_ARRANGEMENT_LABELS[row.workArrangement] : null]
    .filter(Boolean)
    .join(' · ');

  async function handleChange(stageId: string, select: HTMLSelectElement) {
    const target = stages.find((stage) => stage.id === stageId);
    if (!target) return;
    const rect = select.getBoundingClientRect();
    celebrateMove({
      from: { kind: row.stage.kind, position: row.stage.position },
      to: { kind: target.kind, position: target.position },
      origin: { x: rect.left + rect.width / 2, y: rect.top },
    });
    try {
      await moveApplication({ variables: { id: row.id, stageId, position: 0 } });
    } catch {
      showToast('gentle', "That change didn't save", 'Check that the Onward server is running, then try again.');
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4 transition hover:border-brand-300 sm:flex-row sm:items-center dark:hover:border-brand-700">
      <Link
        to={`/applications/${row.id}`}
        className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
      >
        <p className="truncate text-lg font-extrabold">{row.company}</p>
        <p className="truncate text-stone-600 dark:text-stone-300">{row.role}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
          {applied && (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon /> Applied {applied}
            </span>
          )}
          {where && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon /> {where}
            </span>
          )}
          {row.contacts.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <UsersIcon /> {row.contacts.map((c) => c.name).join(', ')}
            </span>
          )}
        </div>
      </Link>

      <label className="sr-only" htmlFor={`stage-${row.id}`}>
        Column for {row.company}
      </label>
      <select
        id={`stage-${row.id}`}
        value={row.stage.id}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value, e.target)}
        className={`w-full cursor-pointer rounded-xl border-0 py-2 pr-9 pl-3 font-extrabold sm:w-44 ${STATUS_STYLES[row.stage.kind]}`}
      >
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </select>
    </Card>
  );
}
