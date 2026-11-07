import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery } from '@apollo/client';
import type { DailyGoalKind, DailyGoalsQuery } from '../../gql/graphql';
import {
  CreateDailyGoalMutation,
  DailyGoalsQuery as DailyGoalsDocument,
  DeleteDailyGoalMutation,
  ReorderDailyGoalsMutation,
  TodayQuery,
  UpdateDailyGoalMutation,
} from '../../graphql/operations';
import { GOAL_KINDS, goalLabel, goalProgress } from '../../lib/goals';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon } from '../icons';
import { Button, Card, ErrorBanner, Input, Select } from '../ui';

type Goal = DailyGoalsQuery['dailyGoals'][number];

const MAX_GOALS = 6;
const refetchQueries = ['DailyGoals', 'Today', 'Streak', 'Progress'];

/** Your daily goals, with today's progress, and a way to change them. */
export default function DailyGoalsCard() {
  const { data } = useQuery(DailyGoalsDocument);
  const { data: todayData } = useQuery(TodayQuery, { fetchPolicy: 'cache-and-network' });
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Arriving from "Edit" on the board's Today strip scrolls here.
  useEffect(() => {
    if (window.location.hash === '#goals') document.getElementById('goals')?.scrollIntoView({ block: 'start' });
  }, []);

  if (!data) return null;
  const goals = data.dailyGoals;
  const today = todayData?.today;
  const progressById = new Map((today?.goals ?? []).map((progress) => [progress.goal.id, progress]));

  return (
    <Card className="scroll-mt-24 p-5">
      <div id="goals" className="mb-1 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-black">Daily goals</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            They check themselves off as you go. Finish them all for a perfect day.
          </p>
        </div>
        {goals.length > 0 && (
          <Button variant="ghost" onClick={() => setEditing(!editing)} className="text-sm">
            {editing ? (
              <>
                <CheckIcon /> Done
              </>
            ) : (
              <>
                <PencilIcon /> Edit goals
              </>
            )}
          </Button>
        )}
      </div>

      <div className="mt-3">
        <ErrorBanner messages={errors} />
      </div>

      {goals.length === 0 && (
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-300">
          No goals yet. Pick one or two you'll really do. Small and steady beats big and rare.
        </p>
      )}

      <ul className="space-y-2">
        {goals.map((goal, index) =>
          editing ? (
            <EditGoalRow
              key={goal.id}
              goal={goal}
              goals={goals}
              index={index}
              onErrors={setErrors}
            />
          ) : (
            <GoalRow
              key={goal.id}
              goal={goal}
              progress={progressById.get(goal.id)}
              restDay={Boolean(today && !progressById.has(goal.id) && goal.available)}
            />
          ),
        )}
      </ul>

      {(editing || goals.length === 0) && goals.length < MAX_GOALS && (
        <AddGoal data={data} onErrors={setErrors} />
      )}
    </Card>
  );
}

function GoalRow({
  goal,
  progress,
  restDay,
}: {
  goal: Goal;
  progress?: { count: number; done: boolean };
  restDay: boolean;
}) {
  const done = progress?.done ?? false;
  return (
    <li className="flex items-center gap-3 rounded-xl bg-stone-100 px-3 py-2.5 dark:bg-stone-800/60">
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${
          done ? 'bg-emerald-500 text-white' : 'border-2 border-stone-300 text-transparent dark:border-stone-600'
        }`}
      >
        <CheckIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-extrabold ${goal.available ? '' : 'text-stone-400'}`}>{goalLabel(goal)}</span>
        <span className="block text-xs text-stone-500 dark:text-stone-400">
          {goal.weekdaysOnly ? 'Weekdays' : 'Every day'}
          {!goal.available && (
            <>
              {' · '}
              Paused while the{' '}
              <Link to="/prep/customize" className="underline">
                engineering track
              </Link>{' '}
              is off
            </>
          )}
        </span>
      </span>
      <span className="text-sm font-bold text-stone-500 tabular-nums dark:text-stone-400">
        {restDay ? 'Rest day' : progress ? (done ? 'Done' : goalProgress(goal.kind, progress.count, goal.target)) : ''}
      </span>
    </li>
  );
}

function EditGoalRow({
  goal,
  goals,
  index,
  onErrors,
}: {
  goal: Goal;
  goals: readonly Goal[];
  index: number;
  onErrors: (errors: string[]) => void;
}) {
  const [target, setTarget] = useState(String(goal.target));
  const [updateGoal] = useMutation(UpdateDailyGoalMutation, { refetchQueries });
  const [deleteGoal] = useMutation(DeleteDailyGoalMutation, { refetchQueries });
  const [reorder] = useMutation(ReorderDailyGoalsMutation, { refetchQueries });

  useEffect(() => setTarget(String(goal.target)), [goal.target]);

  async function save(changes: { target?: number; weekdaysOnly?: boolean }) {
    onErrors([]);
    const { data } = await updateGoal({ variables: { id: goal.id, ...changes } });
    const result = data?.updateDailyGoal;
    if (result && !result.dailyGoal) {
      onErrors(result.errors.map((error) => error.message));
      setTarget(String(goal.target));
    }
  }

  function saveTarget() {
    const value = Number(target);
    if (!Number.isInteger(value) || value === goal.target) {
      setTarget(String(goal.target));
      return;
    }
    void save({ target: value });
  }

  function move(offset: number) {
    const ids = goals.map((g) => g.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + offset, 0, moved);
    void reorder({ variables: { ids } });
  }

  const unit = goal.kind === 'STUDY' ? 'minutes' : goal.target === 1 ? 'time a day' : 'times a day';
  const saved = goalLabel(goal);
  const preview = goalLabel({ ...goal, target: Number(target) || goal.target });

  return (
    <li className="rounded-xl border-2 border-stone-200 p-3 dark:border-stone-700">
      <div className="mb-2 flex items-center gap-2">
        <span className="min-w-0 flex-1 font-extrabold">{preview}</span>
        <button
          type="button"
          aria-label={`Move "${saved}" up`}
          disabled={index === 0}
          onClick={() => move(-1)}
          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-800"
        >
          <ChevronUpIcon />
        </button>
        <button
          type="button"
          aria-label={`Move "${saved}" down`}
          disabled={index === goals.length - 1}
          onClick={() => move(1)}
          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-800"
        >
          <ChevronDownIcon />
        </button>
        <button
          type="button"
          aria-label={`Remove "${saved}"`}
          onClick={() => void deleteGoal({ variables: { id: goal.id } })}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
        >
          <TrashIcon />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Input
            type="number"
            inputMode="numeric"
            min={goal.minTarget}
            max={goal.maxTarget}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onBlur={saveTarget}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-20! py-1.5!"
            aria-label={`How many for "${saved}"`}
          />
          <span className="text-stone-500 dark:text-stone-400">{unit}</span>
        </label>
        <Select
          value={goal.weekdaysOnly ? 'weekdays' : 'every'}
          onChange={(e) => void save({ weekdaysOnly: e.target.value === 'weekdays' })}
          className="w-auto! py-1.5!"
          aria-label={`When "${saved}" applies`}
        >
          <option value="every">Every day</option>
          <option value="weekdays">Weekdays</option>
        </Select>
      </div>
    </li>
  );
}

function AddGoal({ data, onErrors }: { data: DailyGoalsQuery; onErrors: (errors: string[]) => void }) {
  const [choice, setChoice] = useState('');
  const [target, setTarget] = useState('1');
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [createGoal, { loading }] = useMutation(CreateDailyGoalMutation, { refetchQueries });

  const used = new Set(data.dailyGoals.map((goal) => goal.kind));
  const customWithGoal = new Set(data.dailyGoals.map((goal) => goal.customAction?.id).filter(Boolean));
  const builtIn = GOAL_KINDS.filter(
    (option) => !used.has(option.kind) && (!option.engineering || data.me?.engineeringTrack),
  );
  const custom = data.customActions.filter((action) => !customWithGoal.has(action.id));

  function choose(value: string) {
    setChoice(value);
    const option = GOAL_KINDS.find((o) => o.kind === value);
    setTarget(String(option?.defaultTarget ?? 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice) return;
    onErrors([]);
    const isCustom = choice.startsWith('custom:');
    const { data: result } = await createGoal({
      variables: {
        kind: (isCustom ? 'CUSTOM' : choice) as DailyGoalKind,
        target: Number(target),
        weekdaysOnly,
        customActionId: isCustom ? choice.slice('custom:'.length) : null,
      },
    });
    const created = result?.createDailyGoal;
    if (created?.dailyGoal) {
      setChoice('');
      setWeekdaysOnly(false);
    } else {
      onErrors(created?.errors.map((error) => error.message) ?? ['Something went wrong. Try again.']);
    }
  }

  if (builtIn.length === 0 && custom.length === 0) return null;
  const hint = GOAL_KINDS.find((o) => o.kind === choice)?.hint;

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-xl bg-stone-100 p-3 dark:bg-stone-800/60">
      <p className="mb-2 text-sm font-extrabold">Add a goal</p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={choice} onChange={(e) => choose(e.target.value)} className="w-auto! min-w-0 flex-1 py-1.5!" aria-label="Goal">
          <option value="">Choose one…</option>
          {builtIn.map((option) => (
            <option key={option.kind} value={option.kind}>
              {option.title}
            </option>
          ))}
          {custom.length > 0 && (
            <optgroup label="Your actions">
              {custom.map((action) => (
                <option key={action.id} value={`custom:${action.id}`}>
                  {action.name}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
        {choice && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-20! py-1.5!"
                aria-label="How many"
              />
              <span className="text-stone-500 dark:text-stone-400">{choice === 'STUDY' ? 'minutes' : 'a day'}</span>
            </label>
            <Select
              value={weekdaysOnly ? 'weekdays' : 'every'}
              onChange={(e) => setWeekdaysOnly(e.target.value === 'weekdays')}
              className="w-auto! py-1.5!"
              aria-label="When"
            >
              <option value="every">Every day</option>
              <option value="weekdays">Weekdays</option>
            </Select>
            <Button type="submit" disabled={loading} className="px-4! py-1.5! text-sm">
              Add
            </Button>
          </>
        )}
      </div>
      {hint && <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Counts: {hint.charAt(0).toLowerCase() + hint.slice(1)}.</p>}
      {!data.me?.engineeringTrack && (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          LeetCode and GitHub goals appear when the{' '}
          <Link to="/prep/customize" className="underline">
            software engineering track
          </Link>{' '}
          is on.
        </p>
      )}
    </form>
  );
}
