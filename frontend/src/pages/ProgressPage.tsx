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
      <PageHeader
        title="Your progress"
        titleClassName="font-serif text-[32px]/[36px] font-medium sm:text-[40px]/[44px]"
        subtitle="Every step counts, whether or not it pays off right away."
      />

      <div className="space-y-10">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
          <div className="min-w-0 space-y-10">
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

        <Card className="p-6">
          <h2 className="mb-4 text-[22px]/7 font-semibold">Your activity</h2>
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
    <section aria-labelledby="streak-heading" className="border-b border-line pb-8">
      <h2 id="streak-heading" className="sr-only">
        Your streak
      </h2>
      <p className="flex items-baseline gap-2">
        <span className="font-serif text-[56px]/[58px] font-medium tracking-tight tabular-nums lining-nums">
          {current}
        </span>
        <span className="font-serif text-[22px]/7 text-muted">{current === 1 ? 'day' : 'days'}</span>
        <FlameIcon
          className={`shrink-0 self-center text-2xl ${activeToday ? 'text-gold-500' : 'text-stone-400'}`}
          strokeWidth={2}
        />
      </p>
      <p className="mt-3 text-lg/7">{message}</p>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]/[18px] text-muted">
        <li>Longest streak: {plural(longest, 'day')}</li>
        {(perfectStreak > 0 || perfectToday) && (
          <li className="inline-flex items-center gap-1.5">
            <StarIcon className="text-gold-500" />
            {perfectStreak === 1 ? '1 perfect day' : `${perfectStreak} perfect days in a row`}
            {perfectToday && ', including today'}
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
                className={slot < freezes ? 'text-sky-600 dark:text-sky-400' : 'text-stone-300 dark:text-stone-600'}
              />
            ))}
          </span>
          {freezes === 0 ? 'No freezes yet' : `${plural(freezes, 'freeze')} ready`}
        </li>
      </ul>
    </section>
  );
}
