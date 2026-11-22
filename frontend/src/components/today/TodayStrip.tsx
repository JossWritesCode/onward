import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery } from '@apollo/client';
import type { TodayQuery } from '../../gql/graphql';
import { RefreshIntegrationsMutation, TodayQuery as TodayDocument } from '../../graphql/operations';
import { goalLabel, goalLink, goalProgress, isSyncedGoal } from '../../lib/goals';
import { goalsStreakLabel } from '../../lib/celebrate';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, RefreshIcon, TargetIcon } from '../icons';
import NudgeList from './NudgeList';

type Today = TodayQuery['today'];
type GoalProgress = Today['goals'][number];

// A plain, quiet surface, so the board below stays the main thing on the page.
const surface = 'mb-5 rounded-xl border border-line bg-surface';
const quietButton =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-muted transition ' +
  'hover:bg-stone-100 hover:text-ink dark:hover:bg-night-900 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus';

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
      <div className={`${surface} flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2`}>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tint text-tint-ink">
          <CheckIcon />
        </span>
        <p className="min-w-48 flex-1 text-sm">
          <span className="font-bold">Today's goals are complete.</span>{' '}
          <span className="text-muted">
            {today.goals.length === 1 ? 'Your goal is done.' : `All ${today.goals.length} goals done.`}
            {today.perfectStreak > 1 && ` ${goalsStreakLabel(today.perfectStreak)}.`}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`${quietButton} ml-auto`}
        >
          {today.nudges.length > 0 ? `Show goals and ${today.nudges.length} ${today.nudges.length === 1 ? 'nudge' : 'nudges'}` : 'Show goals'}
          <ChevronDownIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={`${surface} p-4`}>
      <div className={`grid gap-4 ${today.nudges.length > 0 ? 'lg:grid-cols-[3fr_2fr]' : ''}`}>
        <section aria-labelledby="today-goals" className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 id="today-goals" className="flex items-center gap-1.5 text-base/[22px] font-bold">
              <TargetIcon className="text-link" />
              Today's goals
            </h2>
            {today.goals.length > 0 && (
              <span className="text-sm text-muted">
                {done} of {today.goals.length} done
              </span>
            )}
            {today.perfectStreak > 0 && (
              <span className="text-sm text-muted" title="Days in a row with every goal done">
                · {goalsStreakLabel(today.perfectStreak)}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              {today.goals.some((goal) => isSyncedGoal(goal.goal.kind) && !goal.done) && <RefreshButton />}
              {today.hasGoals && (
                <Link
                  to="/progress#goals"
                  className={quietButton}
                >
                  <PencilIcon /> Edit
                </Link>
              )}
              {today.perfect && (
                <button
                  type="button"
                  aria-label="Shrink"
                  onClick={() => setExpanded(false)}
                  className={quietButton}
                >
                  <ChevronUpIcon />
                </button>
              )}
            </span>
          </div>

          {!today.hasGoals ? (
            <p className="text-sm text-muted">
              Give each day a finish line.{' '}
              <Link to="/progress#goals" className="font-semibold text-link hover:underline">
                Set a daily goal
              </Link>
            </p>
          ) : today.restDay ? (
            <p className="text-sm text-muted">
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
            className="min-w-0 border-t border-line pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4"
          >
            <h2 id="today-nudges" className="mb-2 text-base/[22px] font-bold">
              Worth a look
            </h2>
            <NudgeList nudges={today.nudges} today={today.date} />
          </section>
        )}
      </div>
    </div>
  );
}

function GoalChip({ goal }: { goal: GoalProgress }) {
  const { kind, target } = goal.goal;
  const link = goalLink(kind);
  const label = goalLabel(goal.goal);
  const progress = goalProgress(kind, goal.count, target);
  const className = `group inline-flex items-center gap-2 rounded-xl border py-1.5 pr-3 pl-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
    goal.done
      ? 'border-transparent bg-tint text-tint-ink'
      : 'border-line bg-surface hover:border-brand-300 dark:hover:border-brand-700'
  }`;

  const content = (
    <>
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${
          goal.done
            ? 'animate-pop-in bg-done text-surface'
            : 'border-[1.5px] border-control text-transparent group-hover:border-link'
        }`}
      >
        <CheckIcon />
      </span>
      <span className="font-semibold">{label}</span>
      <span className={`tabular-nums ${goal.done ? 'text-done' : 'text-muted'}`}>
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
      className={`${quietButton} disabled:opacity-60`}
    >
      <RefreshIcon className={loading ? 'animate-spin' : ''} />
      {loading ? 'Checking…' : 'Check now'}
    </button>
  );
}
