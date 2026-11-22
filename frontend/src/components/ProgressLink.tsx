import { useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { NavLink } from 'react-router';
import { StreakQuery } from '../graphql/operations';
import { STREAK_MILESTONES } from '../lib/activities';
import { celebrateGoalsComplete, celebrateStreakMilestone } from '../lib/celebrate';
import { ProgressIcon } from './icons';

/**
 * The Progress link in the header. It also notices, wherever you are in the
 * app, when you finish today's goals or reach a streak milestone, and adds
 * that to the toast for whatever you just did.
 */
export default function ProgressLink({ className }: { className: (isActive: boolean) => string }) {
  const { data } = useQuery(StreakQuery);
  const streak = data?.progress.streak;
  const goalsDay = data?.progress.perfectDay;
  const previous = useRef<number | null>(null);
  const wasComplete = useRef<boolean | null>(null);

  useEffect(() => {
    if (!streak) return;
    const before = previous.current;
    previous.current = streak.current;
    if (before === null || streak.current <= before) return;
    if (STREAK_MILESTONES.includes(streak.current)) celebrateStreakMilestone(streak.current);
  }, [streak]);

  useEffect(() => {
    if (!goalsDay) return;
    const before = wasComplete.current;
    wasComplete.current = goalsDay.today;
    if (before === false && goalsDay.today) celebrateGoalsComplete(goalsDay.streak);
  }, [goalsDay]);

  // Your streak stays a quiet detail: a tooltip here, and a line on the Progress page.
  const current = streak?.current ?? 0;
  const title = !streak
    ? undefined
    : streak.activeToday
      ? `${current}-day streak. You've shown up today.`
      : current > 0
        ? `${current}-day streak. Do one thing today to keep it going.`
        : 'No streak yet. Do one thing today to start one.';

  return (
    <NavLink to="/progress" title={title} className={({ isActive }) => className(isActive)}>
      <ProgressIcon className="text-lg" />
      <span className="hidden sm:inline">Progress</span>
      <span className="sr-only sm:hidden">Progress</span>
    </NavLink>
  );
}
