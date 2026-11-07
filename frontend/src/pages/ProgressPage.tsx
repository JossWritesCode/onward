import { useQuery } from '@apollo/client';
import { ProgressQuery } from '../graphql/operations';
import { addDays, plural } from '../lib/activities';
import { todayIso } from '../lib/format';
import DailyGoalsCard from '../components/progress/DailyGoalsCard';
import HeatMap from '../components/progress/HeatMap';
import LogWin from '../components/progress/LogWin';
import RecentActivity from '../components/progress/RecentActivity';
import WeeklyRecap from '../components/progress/WeeklyRecap';
import { FlameIcon, SnowflakeIcon, StarIcon } from '../components/icons';
import { Card, ErrorBanner, PageHeader, Spinner } from '../components/ui';

export default function ProgressPage() {
  // A little over a year, so the heat map and recaps have everything they need.
  const { data, loading, error } = useQuery(ProgressQuery, { variables: { since: addDays(todayIso(), -380) } });

  if (error) return <ErrorBanner messages={[error.message]} />;
  if (loading && !data) return <Spinner />;
  if (!data) return null;

  const { today, streak, activities, perfectDay, perfectDays } = data.progress;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Your progress" subtitle="Every step counts, whether or not it pays off right away." />

      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-5">
            <StreakCard
              current={streak.current}
              longest={streak.longest}
              freezes={streak.freezes}
              activeToday={streak.activeToday}
              perfectStreak={perfectDay.streak}
              perfectToday={perfectDay.today}
            />
            <DailyGoalsCard />
            <LogWin />
          </div>
          <WeeklyRecap activities={activities} today={today} streak={streak.current} perfectDays={perfectDays} />
        </div>

        <Card className="p-5">
          <h2 className="mb-3 text-xl font-black">Your activity</h2>
          <HeatMap activities={activities} today={today} frozenDates={streak.frozenDates} perfectDates={perfectDays} />
        </Card>

        <RecentActivity activities={activities} today={today} />
      </div>
    </div>
  );
}

function StreakCard({
  current,
  longest,
  freezes,
  activeToday,
  perfectStreak,
  perfectToday,
}: {
  current: number;
  longest: number;
  freezes: number;
  activeToday: boolean;
  perfectStreak: number;
  perfectToday: boolean;
}) {
  const message = activeToday
    ? "You showed up today. See you tomorrow."
    : current > 0
      ? 'Do one thing today to keep your streak going.'
      : 'Do one thing today to start a streak. Any step counts.';

  return (
    <Card
      className={`flex flex-wrap items-center gap-5 p-5 ${
        activeToday ? 'border-gold-300 bg-gold-100/60 dark:border-amber-800 dark:bg-amber-950/30' : ''
      }`}
    >
      <span
        className={`flex size-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${
          activeToday ? 'bg-gold-400 text-white' : 'bg-stone-200 text-stone-400 dark:bg-stone-800'
        }`}
      >
        <FlameIcon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-3xl font-black tabular-nums">{plural(current, 'day')}</p>
        <p className="text-stone-600 dark:text-stone-300">{message}</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Longest streak: {plural(longest, 'day')}</p>
        {(perfectStreak > 0 || perfectToday) && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-sm font-extrabold text-gold-700 dark:bg-amber-950/50 dark:text-amber-200">
            <StarIcon className="text-gold-500" />
            {perfectStreak === 1 ? '1 perfect day' : `${perfectStreak} perfect days in a row`}
            {perfectToday && ', including today'}
          </p>
        )}
      </div>
      <div
        className="flex w-full items-center gap-2 sm:block sm:w-auto sm:text-center"
        title="A freeze covers a missed day. You earn one every 7 days in a row, up to 2."
      >
        <div className="flex justify-center gap-1 text-2xl">
          {[0, 1].map((slot) => (
            <SnowflakeIcon
              key={slot}
              className={slot < freezes ? 'text-sky-500' : 'text-stone-300 dark:text-stone-700'}
            />
          ))}
        </div>
        <p className="text-xs font-bold text-stone-500 sm:mt-1 dark:text-stone-400">
          {freezes === 0 ? 'No freezes yet' : `${plural(freezes, 'freeze')} ready`}
        </p>
      </div>
    </Card>
  );
}
