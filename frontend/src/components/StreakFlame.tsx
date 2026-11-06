import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { NavLink } from 'react-router';
import { StreakQuery } from '../graphql/operations';
import { STREAK_MILESTONES } from '../lib/activities';
import { celebrateStreakMilestone } from '../lib/celebrate';
import { FlameIcon } from './icons';

/** Your streak in the header on every page. Gold once you've done something today. */
export default function StreakFlame() {
  const { data } = useQuery(StreakQuery);
  const streak = data?.progress.streak;
  const previous = useRef<number | null>(null);
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
        `inline-flex items-center gap-1 rounded-xl px-2 py-1.5 font-black transition sm:px-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 ${
          lit
            ? 'bg-gold-100 text-gold-700 hover:bg-gold-300/50 dark:bg-amber-900/40 dark:text-amber-200'
            : 'text-stone-400 hover:bg-stone-200/60 hover:text-stone-600 dark:hover:bg-stone-800'
        } ${isActive ? 'ring-2 ring-gold-300 dark:ring-amber-700' : ''}`
      }
    >
      <FlameIcon className={`text-xl transition-transform ${bump ? 'scale-125 -rotate-6' : ''} ${lit ? 'text-gold-500' : ''}`} />
      <span className="tabular-nums">{current}</span>
    </NavLink>
  );
}
