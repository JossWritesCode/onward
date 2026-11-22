import { useMemo, useState } from 'react';
import type { ProgressQuery } from '../../gql/graphql';
import { addDays, formatDay, mondayOf, plural } from '../../lib/activities';
import { showToast } from '../../lib/celebrate';
import { drawRecapImage, type RecapStat } from '../../lib/recapImage';
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, FlameIcon, ShareIcon } from '../icons';
import { Button, Card } from '../ui';

type Activity = ProgressQuery['progress']['activities'][number];

/** This week's wins, ready to share with friends and family. */
export default function WeeklyRecap({
  activities,
  today,
  streak,
  perfectDays,
}: {
  activities: readonly Activity[];
  today: string;
  streak: number;
  perfectDays: readonly string[];
}) {
  const [weeksBack, setWeeksBack] = useState(0);
  const [includeCompanies, setIncludeCompanies] = useState(false);
  const [sharing, setSharing] = useState(false);

  const start = addDays(mondayOf(today), -7 * weeksBack);
  const end = addDays(start, 6);
  const isThisWeek = weeksBack === 0;

  const recap = useMemo(() => {
    const inWeek = activities.filter((a) => a.occurredOn >= start && a.occurredOn <= end);
    const count = (test: (a: Activity) => boolean) => inWeek.filter(test).length;
    const companies = [
      ...new Set(
        inWeek.filter((a) => a.kind === 'APPLICATION_SENT' && a.jobApplication).map((a) => a.jobApplication!.company),
      ),
    ];
    return {
      total: inWeek.length,
      applications: count((a) => a.kind === 'APPLICATION_SENT'),
      networking: count((a) => a.category === 'NETWORKING'),
      interviews: count((a) => a.kind === 'INTERVIEW'),
      materials: count((a) => a.kind === 'TAILORED_MATERIALS'),
      leetcode: count((a) => a.kind === 'LEETCODE'),
      practice: count((a) => a.kind === 'INTERVIEW_PRACTICE' || a.kind === 'STUDY_SESSION'),
      offers: count((a) => a.kind === 'OFFER'),
      closures: count((a) => a.kind === 'REJECTION'),
      perfect: perfectDays.filter((day) => day >= start && day <= end).length,
      companies,
    };
  }, [activities, perfectDays, start, end]);

  const stats: RecapStat[] = [
    { value: recap.applications, label: recap.applications === 1 ? 'application' : 'applications' },
    { value: recap.networking, label: 'networking' },
    { value: recap.interviews, label: recap.interviews === 1 ? 'interview' : 'interviews' },
    { value: recap.materials, label: 'tailored materials' },
    { value: recap.leetcode, label: recap.leetcode === 1 ? 'LeetCode day' : 'LeetCode days' },
    { value: recap.practice, label: recap.practice === 1 ? 'practice session' : 'practice sessions' },
  ];
  if (recap.perfect > 0) stats.splice(1, 0, { value: recap.perfect, label: recap.perfect === 1 ? 'perfect day' : 'perfect days' });
  if (recap.offers > 0) stats.unshift({ value: recap.offers, label: recap.offers === 1 ? 'offer!' : 'offers!' });
  // Only show what you did, so a shared recap celebrates wins instead of listing zeros.
  const nonZero = stats.filter((stat) => stat.value > 0);
  const shownStats = (nonZero.length > 0 ? nonZero : stats).slice(0, 4);

  const dateRange = `${formatDay(start)} – ${formatDay(end)}`;
  const title = isThisWeek ? 'My job hunt this week' : 'My job hunt last week';
  const showStreak = isThisWeek && streak > 0;
  const companies = includeCompanies ? recap.companies : [];

  function recapText() {
    const lines = [`${title} (${dateRange}):`];
    if (recap.offers > 0) lines.push(`• ${plural(recap.offers, 'offer')}!`);
    if (recap.applications > 0) lines.push(`• ${plural(recap.applications, 'application')} sent`);
    if (recap.networking > 0) lines.push(`• ${plural(recap.networking, 'networking conversation')}`);
    if (recap.interviews > 0) lines.push(`• ${plural(recap.interviews, 'interview')}`);
    if (recap.leetcode > 0) lines.push(`• ${plural(recap.leetcode, 'day')} of LeetCode practice`);
    if (recap.practice > 0) lines.push(`• ${plural(recap.practice, 'practice session')}`);
    if (recap.materials > 0) lines.push(`• ${plural(recap.materials, 'resume or cover letter', 'resumes and cover letters')} tailored`);
    if (recap.closures > 0) lines.push(`• ${plural(recap.closures, 'door')} closed, which is progress too`);
    if (recap.perfect > 0) lines.push(`• ${plural(recap.perfect, 'perfect day')}, with every daily goal done`);
    if (showStreak) lines.push(`• ${streak}-day streak`);
    if (companies.length > 0) lines.push(`Applied to: ${companies.join(', ')}`);
    lines.push('', 'Onward!');
    return lines.join('\n');
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(recapText());
      showToast('celebrate', 'Copied', 'Paste it into a message to share your week.');
    } catch {
      showToast('gentle', "Couldn't copy", 'Your browser blocked copying. Try again, or select the text yourself.');
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
        await navigator.share({ files: [file], text: recapText() });
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
        showToast('gentle', "Couldn't make the image", 'Try again, or copy the text instead.');
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
    <Card className="p-6">
      <div className="flex items-start justify-between gap-2 border-b border-line pb-4">
        <div>
          <h2 className="font-serif text-[28px]/9 font-medium">{heading}</h2>
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

      {/* Numbers first, then what they count, so they line up down the page like a ledger. */}
      <dl className={`mt-5 grid gap-x-6 gap-y-5 ${shownStats.length > 1 ? 'grid-cols-2' : ''}`}>
        {shownStats.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <dt className="order-2 text-sm/5 text-muted">{stat.label}</dt>
            <dd className="order-1 font-serif text-[40px]/[44px] font-medium tabular-nums lining-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex items-center text-link" aria-hidden="true">
        <span className="h-px w-16 bg-current" />
        <ArrowUpRightIcon className="-ml-0.5 text-base" strokeWidth={2} />
      </div>

      {(showStreak || recap.closures > 0) && (
        <ul className="mt-4 space-y-1 text-sm/5">
          {showStreak && (
            <li className="inline-flex items-center gap-1.5 font-medium">
              <FlameIcon className="text-gold-500" /> {streak}-day streak
            </li>
          )}
          {recap.closures > 0 && <li className="text-muted">{plural(recap.closures, 'door')} closed, which is progress too</li>}
        </ul>
      )}

      {recap.total === 0 && (
        <p className="mt-4 text-sm/5 text-muted">
          {isThisWeek ? 'Your week is just getting started.' : 'A quiet week. Rest counts too.'}
        </p>
      )}

      <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm/5 text-muted">
        <input
          type="checkbox"
          checked={includeCompanies}
          onChange={(e) => setIncludeCompanies(e.target.checked)}
          className="size-4 accent-brand-500"
        />
        Include company names when sharing
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={shareImage} disabled={sharing}>
          <ShareIcon /> {sharing ? 'Making image…' : 'Share image'}
        </Button>
        <Button variant="secondary" onClick={copyText}>
          <CopyIcon /> Copy text
        </Button>
      </div>
    </Card>
  );
}
