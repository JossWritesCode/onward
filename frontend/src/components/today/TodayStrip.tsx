import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery } from '@apollo/client';
import type { TodayQuery } from '../../gql/graphql';
import { RefreshIntegrationsMutation, TodayQuery as TodayDocument } from '../../graphql/operations';
import { goalLabel, goalLink, goalProgress, isSyncedGoal } from '../../lib/goals';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, RefreshIcon, StarIcon, TargetIcon } from '../icons';
import { Card } from '../ui';
import NudgeList from './NudgeList';

type Today = TodayQuery['today'];
type GoalProgress = Today['goals'][number];

/** Today's goals and nudges, in one compact strip above the board. */
export default function TodayStrip() {
  const { data } = useQuery(TodayDocument, { fetchPolicy: 'cache-and-network' });
  const [expanded, setExpanded] = useState(false);

  const today = data?.today;
  if (!today) return null;

  const done = today.goals.filter((goal) => goal.done).length;

  // Once every goal is done, the strip shrinks to one line.
  if (today.perfect && !expanded) {
    return (
      <Card className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-gold-300 bg-gold-100/60 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-white">
          <StarIcon />
        </span>
        <p className="min-w-0 flex-1">
          <span className="font-black">Perfect day!</span>{' '}
          <span className="text-stone-600 dark:text-stone-300">
            {today.goals.length === 1 ? 'Your goal is done.' : `All ${today.goals.length} goals done.`}
            {today.perfectStreak > 1 && ` ${today.perfectStreak} perfect days in a row.`}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-extrabold text-gold-700 hover:bg-gold-300/40 dark:text-amber-200 dark:hover:bg-amber-900/40"
        >
          {today.nudges.length > 0 ? `Show goals and ${today.nudges.length} ${today.nudges.length === 1 ? 'nudge' : 'nudges'}` : 'Show goals'}
          <ChevronDownIcon />
        </button>
      </Card>
    );
  }

  return (
    <Card className="mb-5 p-4">
      <div className={`grid gap-4 ${today.nudges.length > 0 ? 'lg:grid-cols-[3fr_2fr]' : ''}`}>
        <section aria-labelledby="today-goals" className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 id="today-goals" className="flex items-center gap-1.5 text-lg font-black">
              <TargetIcon className="text-brand-500" />
              Today's goals
            </h2>
            {today.goals.length > 0 && (
              <span className="text-sm font-bold text-stone-500 dark:text-stone-400">
                {done} of {today.goals.length} done
              </span>
            )}
            {today.perfectStreak > 0 && (
              <span
                className="inline-flex items-center gap-1 text-sm font-extrabold text-gold-700 dark:text-amber-300"
                title="Perfect days in a row: every goal done"
              >
                <StarIcon className="text-gold-500" />
                {today.perfectStreak}-day perfect streak
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              {today.goals.some((goal) => isSyncedGoal(goal.goal.kind) && !goal.done) && <RefreshButton />}
              {today.hasGoals && (
                <Link
                  to="/progress#goals"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-extrabold text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  <PencilIcon /> Edit
                </Link>
              )}
              {today.perfect && (
                <button
                  type="button"
                  aria-label="Shrink"
                  onClick={() => setExpanded(false)}
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                >
                  <ChevronUpIcon />
                </button>
              )}
            </span>
          </div>

          {!today.hasGoals ? (
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Give each day a finish line.{' '}
              <Link to="/progress#goals" className="font-extrabold text-brand-600 hover:underline dark:text-brand-300">
                Set a daily goal
              </Link>
            </p>
          ) : today.restDay ? (
            <p className="text-sm text-stone-600 dark:text-stone-300">
              No goals today. Your goals are for weekdays, so enjoy the rest.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {today.goals.map((goal) => (
                <li key={goal.goal.id}>
                  <GoalChip goal={goal} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {today.nudges.length > 0 && (
          <section
            aria-labelledby="today-nudges"
            className="min-w-0 border-t-2 border-stone-100 pt-4 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-4 dark:border-stone-800"
          >
            <h2 id="today-nudges" className="mb-2 text-lg font-black">
              Worth a look
            </h2>
            <NudgeList nudges={today.nudges} today={today.date} />
          </section>
        )}
      </div>
    </Card>
  );
}

function GoalChip({ goal }: { goal: GoalProgress }) {
  const { kind, target } = goal.goal;
  const link = goalLink(kind);
  const label = goalLabel(goal.goal);
  const progress = goalProgress(kind, goal.count, target);
  const className = `group inline-flex items-center gap-2 rounded-2xl border-2 py-1.5 pr-3 pl-1.5 text-sm transition ${
    goal.done
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
      : 'border-stone-200 bg-white hover:border-brand-300 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-brand-700'
  }`;

  const content = (
    <>
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${
          goal.done
            ? 'bg-emerald-500 text-white'
            : 'border-2 border-stone-300 text-transparent group-hover:border-brand-400 dark:border-stone-600'
        }`}
      >
        <CheckIcon />
      </span>
      <span className="font-extrabold">{label}</span>
      <span className={`tabular-nums ${goal.done ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-500 dark:text-stone-400'}`}>
        {progress}
      </span>
    </>
  );

  const description = `${label}: ${goal.done ? 'done' : progress}`;
  if (link.external) {
    return (
      <a href={link.to} target="_blank" rel="noreferrer" className={className} aria-label={description} title={description}>
        {content}
      </a>
    );
  }
  return (
    <Link to={link.to} className={className} aria-label={description} title={description}>
      {content}
    </Link>
  );
}

/** LeetCode and GitHub are checked every 30 minutes. This checks now. */
function RefreshButton() {
  const [refresh, { loading }] = useMutation(RefreshIntegrationsMutation, {
    refetchQueries: ['Today', 'Streak'],
    awaitRefetchQueries: true,
  });
  return (
    <button
      type="button"
      onClick={() => void refresh().catch(() => {})}
      disabled={loading}
      title="Check LeetCode and GitHub now"
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-extrabold text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-60 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      <RefreshIcon className={loading ? 'animate-spin' : ''} />
      {loading ? 'Checking…' : 'Check now'}
    </button>
  );
}
