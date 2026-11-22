import { useMemo, useState } from 'react';
import type { ProgressQuery } from '../../gql/graphql';
import { addDays, formatDay, mondayOf, plural } from '../../lib/activities';
import { countWeek, recapStats, recapText } from '../../lib/recap';
import { showToast } from '../../lib/celebrate';
import { drawRecapImage } from '../../lib/recapImage';
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon, OnwardRuleIcon, ShareIcon } from '../icons';
import { Button } from '../ui';

type Activity = ProgressQuery['progress']['activities'][number];

/** What you did this week, ready to share with friends and family. It leads the Progress page. */
export default function WeeklyRecap({
  activities,
  today,
  streak,
  goalDays,
}: {
  activities: readonly Activity[];
  today: string;
  streak: number;
  /** Days when every daily goal was done. */
  goalDays: readonly string[];
}) {
  const [weeksBack, setWeeksBack] = useState(0);
  const [includeCompanies, setIncludeCompanies] = useState(false);
  const [sharing, setSharing] = useState(false);

  const start = addDays(mondayOf(today), -7 * weeksBack);
  const end = addDays(start, 6);
  const isThisWeek = weeksBack === 0;

  const week = useMemo(() => countWeek(activities, goalDays, start, end), [activities, goalDays, start, end]);
  const shownStats = recapStats(week);

  const dateRange = `${formatDay(start)} – ${formatDay(end)}`;
  const title = isThisWeek ? 'My job hunt this week' : 'My job hunt last week';
  const showStreak = isThisWeek && streak > 0;
  const companies = includeCompanies ? week.companies : [];

  function shareText() {
    return recapText({ title, dateRange, week, streak: showStreak ? streak : 0, companies });
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(shareText());
      showToast('celebrate', 'Copied', 'Paste it into a message to share your week.');
    } catch {
      showToast('error', "Couldn't copy", 'Your browser blocked copying. Try again, or select the text yourself.');
    }
  }

  async function shareImage() {
    setSharing(true);
    try {
      const blob = await drawRecapImage({
        title,
        dateRange,
        stats: shownStats,
        streak: showStreak ? streak : 0,
        companies,
      });
      const file = new File([blob], `onward-week-of-${start}.png`, { type: 'image/png' });

      // Phones open the share sheet; computers download the image.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText() });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        showToast('error', "Couldn't make the image", 'Try again, or copy the text instead.');
      }
    } finally {
      setSharing(false);
    }
  }

  const heading = isThisWeek ? 'This week' : weeksBack === 1 ? 'Last week' : `Week of ${formatDay(start)}`;
  const weekButton =
    'flex size-10 items-center justify-center rounded-lg text-lg text-muted hover:bg-stone-200/60 hover:text-ink ' +
    'disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-stone-800';

  return (
    <section aria-labelledby="week-heading" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-start justify-between gap-2 border-b border-line pb-4">
        <div>
          <h2 id="week-heading" className="font-serif text-[32px]/10 font-medium">
            {heading}
          </h2>
          <p className="mt-0.5 text-[13px]/[18px] text-muted tabular-nums">{dateRange}</p>
        </div>
        <div className="-mr-2 flex">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setWeeksBack((n) => Math.min(n + 1, 51))}
            className={weekButton}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setWeeksBack((n) => Math.max(n - 1, 0))}
            disabled={isThisWeek}
            className={weekButton}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Numbers first, then what they count, lined up like a ledger. */}
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {shownStats.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <dt className="order-2 text-sm/5 text-muted">{stat.label}</dt>
            <dd className="order-1 font-serif text-[44px]/[48px] font-medium tabular-nums lining-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {week.total === 0 && (
        <p className="mt-4 text-sm/5 text-muted">
          {isThisWeek ? 'Your week is just getting started. Anything you do will show up here.' : 'A quiet week. Rest counts too.'}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3 text-sm/5">
        <OnwardRuleIcon className="shrink-0 text-base text-link" strokeWidth={2} />
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
          {showStreak && <span>{streak}-day streak</span>}
          {week.closures > 0 && <span>{plural(week.closures, 'door')} closed, which is progress too</span>}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5">
        <div className="flex flex-wrap gap-2">
          <Button onClick={shareImage} disabled={sharing}>
            <ShareIcon /> {sharing ? 'Making image…' : 'Share image'}
          </Button>
          <Button variant="secondary" onClick={copyText}>
            <CopyIcon /> Copy text
          </Button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm/5 text-muted">
          <input
            type="checkbox"
            checked={includeCompanies}
            onChange={(e) => setIncludeCompanies(e.target.checked)}
            className="size-4 accent-action"
          />
          Include company names when sharing
        </label>
      </div>
    </section>
  );
}
