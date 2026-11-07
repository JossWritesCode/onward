import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@apollo/client';
import type { TodayQuery } from '../../gql/graphql';
import { DismissNudgeMutation, LogActivityMutation } from '../../graphql/operations';
import { parseIso } from '../../lib/activities';
import { celebrateWin } from '../../lib/celebrate';
import { describeInterviewTime } from '../../lib/countdown';
import { BellIcon, ClockIcon, XIcon } from '../icons';

type Nudge = TodayQuery['today']['nudges'][number];

function weeksSince(since: string, today: string) {
  const days = Math.round((parseIso(today).getTime() - parseIso(since).getTime()) / 86_400_000);
  const weeks = Math.max(1, Math.floor(days / 7));
  return weeks === 1 ? 'a week' : `${weeks} weeks`;
}

/** Gentle reminders, each with a quick way to act on it, snooze it, or let it go. */
export default function NudgeList({ nudges, today }: { nudges: readonly Nudge[]; today: string }) {
  // Phones show one at a time, so the board isn't pushed far down.
  const [showAll, setShowAll] = useState(false);
  const hiddenOnPhones = showAll ? 0 : nudges.length - 1;

  return (
    <>
      <ul className="space-y-2">
        {nudges.map((nudge, index) => (
          <NudgeRow key={nudge.key} nudge={nudge} today={today} phoneHidden={!showAll && index > 0} />
        ))}
      </ul>
      {hiddenOnPhones > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-sm font-extrabold text-brand-600 sm:hidden dark:text-brand-300"
        >
          Show {hiddenOnPhones} more
        </button>
      )}
    </>
  );
}

function NudgeRow({ nudge, today, phoneHidden }: { nudge: Nudge; today: string; phoneHidden: boolean }) {
  const [hiding, setHiding] = useState(false);
  const [dismiss] = useMutation(DismissNudgeMutation, { refetchQueries: ['Today'] });
  const [logActivity, { loading: logging }] = useMutation(LogActivityMutation, {
    refetchQueries: ['Today', 'Streak', 'Progress', 'Contacts'],
  });

  function hide(snooze: boolean) {
    setHiding(true);
    void dismiss({ variables: { key: nudge.key, snooze } }).catch(() => setHiding(false));
  }

  async function log(
    kind: 'FOLLOW_UP' | 'NETWORKING_MESSAGE',
    links: { jobApplicationId?: string; contactId?: string },
    button: HTMLElement,
  ) {
    const rect = button.getBoundingClientRect();
    try {
      const { data } = await logActivity({ variables: { kind, ...links } });
      if (data?.logActivity.activity) {
        setHiding(true);
        celebrateWin(kind, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    } catch {
      // The button stays, so you can try again.
    }
  }

  let title: string;
  let body: string;
  let action: ReactNode = null;

  const actionClass =
    'shrink-0 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-white hover:bg-brand-600 disabled:opacity-60';

  if (nudge.kind === 'INTERVIEW_PREP' && nudge.interviewRound) {
    const round = nudge.interviewRound;
    const items = round.checklistItems;
    const doneCount = items.filter((item) => item.done).length;
    const when = round.scheduledAt ? describeInterviewTime(round.scheduledAt) : 'coming up';
    title = `${round.jobApplication.company} ${round.name.toLowerCase()}: ${when.charAt(0).toLowerCase()}${when.slice(1)}`;
    body = `${doneCount} of ${items.length} prep steps done.`;
    action = (
      <Link to="/prep" className={actionClass}>
        Finish prep
      </Link>
    );
  } else if (nudge.kind === 'QUIET_APPLICATION' && nudge.jobApplication && nudge.since) {
    const application = nudge.jobApplication;
    title = `No news from ${application.company} in ${weeksSince(nudge.since, today)}`;
    body = 'A short follow-up keeps you on their radar.';
    action = (
      <button
        type="button"
        disabled={logging}
        onClick={(e) => void log('FOLLOW_UP', { jobApplicationId: application.id }, e.currentTarget)}
        className={actionClass}
      >
        I followed up
      </button>
    );
  } else if (nudge.kind === 'QUIET_CONTACT' && nudge.contact && nudge.since) {
    const contact = nudge.contact;
    title = contact.lastContactedOn
      ? `You haven't talked to ${contact.name} in ${weeksSince(nudge.since, today)}`
      : `You added ${contact.name} ${weeksSince(nudge.since, today)} ago`;
    body = 'A quick hello keeps the connection warm.';
    action = (
      <button
        type="button"
        disabled={logging}
        onClick={(e) => void log('NETWORKING_MESSAGE', { contactId: contact.id }, e.currentTarget)}
        className={actionClass}
      >
        I reached out
      </button>
    );
  } else {
    return null;
  }

  if (hiding) return null;

  const snoozable = nudge.kind !== 'INTERVIEW_PREP';

  return (
    <li className={`${phoneHidden ? 'hidden sm:flex' : 'flex'} flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl bg-stone-100 py-2 pr-1.5 pl-3 dark:bg-stone-800/60`}>
      <span className="flex min-w-0 flex-1 basis-56 items-start gap-2">
        <BellIcon className="mt-0.5 shrink-0 text-brand-500" />
        <span className="min-w-0">
          <span className="block text-sm font-extrabold">{title}</span>
          <span className="block text-xs text-stone-500 dark:text-stone-400">{body}</span>
        </span>
      </span>
      <span className="ml-auto flex items-center gap-0.5">
        {action}
        {snoozable && (
          <button
            type="button"
            onClick={() => hide(true)}
            aria-label="Snooze for a week"
            title="Snooze for a week"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-200"
          >
            <ClockIcon />
          </button>
        )}
        <button
          type="button"
          aria-label="Dismiss"
          title="Dismiss"
          onClick={() => hide(false)}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-200"
        >
          <XIcon />
        </button>
      </span>
    </li>
  );
}
