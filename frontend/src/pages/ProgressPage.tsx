import { useQuery } from '@apollo/client';
import { ProgressQuery } from '../graphql/operations';
import { addDays, plural } from '../lib/activities';
import { goalsStreakLabel } from '../lib/celebrate';
import { todayIso } from '../lib/format';
import DailyGoalsCard from '../components/progress/DailyGoalsCard';
import HeatMap from '../components/progress/HeatMap';
import LogWin from '../components/progress/LogWin';
import RecentActivity from '../components/progress/RecentActivity';
import WeeklyRecap from '../components/progress/WeeklyRecap';
import { SnowflakeIcon } from '../components/icons';
import { Card, ErrorBanner, PageHeader, Spinner } from '../components/ui';

export default function ProgressPage() {
  // A little over a year, so the heat map and recaps have everything they need.
  const { data, loading, error } = useQuery(ProgressQuery, { variables: { since: addDays(todayIso(), -380) } });

  if (error) return <ErrorBanner messages={[error.message]} />;
  if (loading && !data) return <Spinner />;
  if (!data) return null;

  const { today, streak, activities, perfectDay, perfectDays } = data.progress;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Your progress" subtitle="Every step counts, whether or not it pays off right away." />

      {/*
        What you did this week comes first, with the record of each step under
        it. Today's goals and logging sit alongside, and your streak is a quiet
        note at the end. On phones the goals come right after the week.
      */}
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <WeeklyRecap activities={activities} today={today} streak={streak.current} goalDays={perfectDays} />
        </div>

        <div className="min-w-0 space-y-10 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <DailyGoalsCard />
          <LogWin />
          <StreakNote
            current={streak.current}
            longest={streak.longest}
            freezes={streak.freezes}
            activeToday={streak.activeToday}
            goalStreak={perfectDay.streak}
            goalsToday={perfectDay.today}
          />
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <RecentActivity activities={activities} today={today} />
        </div>
      </div>

      <Card className="mt-10 p-6">
        <h2 className="mb-4 font-serif text-[26px]/8 font-medium">Your activity</h2>
        <HeatMap activities={activities} today={today} frozenDates={streak.frozenDates} goalDates={perfectDays} />
      </Card>
    </div>
  );
}

/** Your streak, kept small: it's a nice extra, not the point. How it's earned hasn't changed. */
function StreakNote({
  current,
  longest,
  freezes,
  activeToday,
  goalStreak,
  goalsToday,
}: {
  current: number;
  longest: number;
  freezes: number;
  activeToday: boolean;
  goalStreak: number;
  goalsToday: boolean;
}) {
  const message = activeToday
    ? 'You showed up today. See you tomorrow.'
    : current > 0
      ? 'Do one thing today to keep your streak going.'
      : 'Do one thing today to start a streak. Any step counts.';

  return (
    <section aria-labelledby="streak-heading" className="border-t border-line pt-6">
      <h2 id="streak-heading" className="text-sm/5 font-semibold text-muted">
        Streak
      </h2>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-serif text-[30px]/9 font-medium tabular-nums lining-nums">{current}</span>
        <span className="font-serif text-lg text-muted">{current === 1 ? 'day' : 'days'}</span>
      </p>
      <p className="mt-1 text-sm/5">{message}</p>

      <ul className="mt-3 space-y-1 text-[13px]/[18px] text-muted">
        <li>Longest streak: {plural(longest, 'day')}</li>
        {(goalStreak > 0 || goalsToday) && (
          <li>
            {goalsStreakLabel(goalStreak)}
            {goalsToday && ', including today'}
          </li>
        )}
        <li
          className="inline-flex items-center gap-1.5"
          title="A freeze covers a missed day. You earn one every 7 days in a row, up to 2."
        >
          <span className="inline-flex gap-0.5" aria-hidden="true">
            {[0, 1].map((slot) => (
              <SnowflakeIcon
                key={slot}
                className={slot < freezes ? 'text-sky-700 dark:text-sky-300' : 'text-stone-300 dark:text-stone-600'}
              />
            ))}
          </span>
          {freezes === 0 ? 'No freezes yet' : `${plural(freezes, 'freeze')} ready`}
        </li>
      </ul>
    </section>
  );
}
