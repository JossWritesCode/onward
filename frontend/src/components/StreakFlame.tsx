import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { NavLink } from 'react-router';
import { StreakQuery } from '../graphql/operations';
import { STREAK_MILESTONES } from '../lib/activities';
import { celebratePerfectDay, celebrateStreakMilestone } from '../lib/celebrate';
import { FlameIcon } from './icons';

/** Your streak in the header on every page. Gold once you've done something today. */
export default function StreakFlame() {
  const { data } = useQuery(StreakQuery);
  const streak = data?.progress.streak;
  const perfectDay = data?.progress.perfectDay;
  const previous = useRef<number | null>(null);
  const wasPerfect = useRef<boolean | null>(null);
  const [bump, setBump] = useState(false);

  // Celebrate when the streak grows into a milestone, and give the flame a little hop.
  useEffect(() => {
    if (!streak) return;
    const before = previous.current;
    previous.current = streak.current;
    if (before === null || streak.current <= before) return;

    setBump(true);
    const timer = setTimeout(() => setBump(false), 600);
    if (STREAK_MILESTONES.includes(streak.current)) celebrateStreakMilestone(streak.current);
    return () => clearTimeout(timer);
  }, [streak]);

  // Celebrate finishing the last of today's goals, wherever in the app it happens.
  useEffect(() => {
    if (!perfectDay) return;
    const before = wasPerfect.current;
    wasPerfect.current = perfectDay.today;
    if (before === false && perfectDay.today) celebratePerfectDay(perfectDay.streak);
  }, [perfectDay]);

  const current = streak?.current ?? 0;
  const lit = streak?.activeToday ?? false;
  const label = !streak
    ? 'Your progress'
    : lit
      ? `${current}-day streak. You've shown up today.`
      : current > 0
        ? `${current}-day streak. Do one thing today to keep it going.`
        : 'No streak yet. Do one thing today to start one.';

  return (
    <NavLink
      to="/progress"
      aria-label={`${label} View your progress.`}
      title={label}
      className={({ isActive }) =>
        `relative inline-flex min-h-10 items-center gap-1 rounded-lg px-2 py-1.5 text-sm/5 font-semibold transition sm:px-2.5 ` +
        `hover:bg-stone-200/60 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-link dark:hover:bg-stone-800 ` +
        `${lit ? 'text-ink' : 'text-muted'} ` +
        `${isActive ? 'after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-gold-500' : ''}`
      }
    >
      <FlameIcon
        className={`text-lg transition-transform ${bump ? 'scale-125 -rotate-6' : ''} ${lit ? 'text-gold-500' : 'text-stone-400'}`}
      />
      <span className="tabular-nums">{current}</span>
    </NavLink>
  );
}
