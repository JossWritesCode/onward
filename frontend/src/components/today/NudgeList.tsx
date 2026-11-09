import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@apollo/client';
import type { FollowUpStep, TodayQuery } from '../../gql/graphql';
import {
  DismissNudgeMutation,
  LetGoOfJobApplicationMutation,
  LogActivityMutation,
  UpdateJobApplicationMutation,
} from '../../graphql/operations';
import { addDays, parseIso } from '../../lib/activities';
import { celebrateLetGo, celebrateWin, showToast } from '../../lib/celebrate';
import { describeInterviewTime } from '../../lib/countdown';
import { BellIcon, ClockIcon, XIcon } from '../icons';

type Nudge = TodayQuery['today']['nudges'][number];

/** "Remind me in 3 days" on follow-up nudges. */
const REMIND_DAYS = 3;

/** What a follow-up nudge says, by step. */
const FOLLOW_UP_COPY: Record<FollowUpStep, { title: (company: string) => string; body: string }> = {
  FOLLOW_UP: {
    title: (company) => `Follow up with ${company}`,
    body: 'A short, friendly note keeps you on their radar.',
  },
  THANK_YOU: {
    title: (company) => `Send ${company} a thank-you note`,
    body: 'A quick thanks after an interview is remembered.',
  },
  CHECK_IN: {
    title: (company) => `Check in with ${company}`,
    body: "A friendly check-in shows you're still excited.",
  },
  LAST_NOTE: {
    title: (company) => `Send ${company} a last gracious note?`,
    body: 'Thank them for their time and leave the door open.',
  },
  LET_GO: {
    title: (company) => `Time to let ${company} go?`,
    body: "You followed up and did everything right. Letting go makes room for what's next.",
  },
};

const ACTION_CLASS =
  'shrink-0 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-white hover:bg-brand-600 disabled:opacity-60';
const SECONDARY_CLASS =
  'shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold whitespace-nowrap text-stone-600 hover:bg-stone-200 disabled:opacity-60 dark:text-stone-300 dark:hover:bg-stone-700';
const ICON_BUTTON_CLASS =
  'rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-200';

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
    refetchQueries: ['Today', 'Streak', 'Progress', 'Contacts', 'Board'],
  });
  // Follow-up nudges are hidden by changing the date itself, not by dismissing them.
  const [updateApplication] = useMutation(UpdateJobApplicationMutation, { refetchQueries: ['Today', 'Board'] });
  const [letGo, { loading: lettingGo }] = useMutation(LetGoOfJobApplicationMutation, {
    refetchQueries: ['Today', 'Board', 'Streak', 'Progress', 'JobApplications'],
  });

  function hide(snooze: boolean) {
    setHiding(true);
    void dismiss({ variables: { key: nudge.key, snooze } }).catch(() => setHiding(false));
  }

  /** Sets the follow-up date, or clears it with null. Either way the nudge goes away. */
  function setFollowUp(jobApplicationId: string, followUpOn: string | null) {
    setHiding(true);
    void updateApplication({ variables: { id: jobApplicationId, input: { followUpOn } } }).catch(() => setHiding(false));
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

  async function handleLetGo(jobApplicationId: string) {
    try {
      const { data } = await letGo({ variables: { id: jobApplicationId } });
      const result = data?.letGoOfJobApplication;
      if (result?.jobApplication) {
        setHiding(true);
        celebrateLetGo();
      } else if (result) {
        showToast('gentle', "Couldn't let it go yet", result.errors.map((error) => error.message).join(' '));
      }
    } catch {
      // The button stays, so you can try again.
    }
  }

  if (hiding) return null;

  let title: string;
  let body: string;
  // The buttons on the right. Most nudges have one action, snooze, and dismiss.
  let buttons: ReactNode;

  const snoozeAndDismiss = (onSnooze: () => void, snoozeLabel: string, onDismiss: () => void) => (
    <>
      <button type="button" onClick={onSnooze} aria-label={snoozeLabel} title={snoozeLabel} className={ICON_BUTTON_CLASS}>
        <ClockIcon />
      </button>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" title="Dismiss" className={ICON_BUTTON_CLASS}>
        <XIcon />
      </button>
    </>
  );

  if (nudge.kind === 'INTERVIEW_PREP' && nudge.interviewRound) {
    const round = nudge.interviewRound;
    const items = round.checklistItems;
    const doneCount = items.filter((item) => item.done).length;
    const when = round.scheduledAt ? describeInterviewTime(round.scheduledAt) : 'coming up';
    title = `${round.jobApplication.company} ${round.name.toLowerCase()}: ${when.charAt(0).toLowerCase()}${when.slice(1)}`;
    body = `${doneCount} of ${items.length} prep steps done.`;
    buttons = (
      <>
        <Link to="/prep" className={ACTION_CLASS}>
          Finish prep
        </Link>
        <button type="button" onClick={() => hide(false)} aria-label="Dismiss" title="Dismiss" className={ICON_BUTTON_CLASS}>
          <XIcon />
        </button>
      </>
    );
  } else if (nudge.kind === 'FOLLOW_UP' && nudge.jobApplication?.followUpStep) {
    const application = nudge.jobApplication;
    const step = nudge.jobApplication.followUpStep;
    const copy = FOLLOW_UP_COPY[step];
    const remindLabel = `Remind me in ${REMIND_DAYS} days`;
    const remind = () => setFollowUp(application.id, addDays(today, REMIND_DAYS));
    title = copy.title(application.company);
    body = copy.body;

    buttons =
      step === 'LET_GO' ? (
        <>
          <button
            type="button"
            disabled={lettingGo}
            onClick={() => void handleLetGo(application.id)}
            className={ACTION_CLASS}
          >
            Let it go
          </button>
          <button type="button" onClick={remind} className={SECONDARY_CLASS}>
            {remindLabel}
          </button>
          <button type="button" onClick={() => setFollowUp(application.id, null)} className={SECONDARY_CLASS}>
            Keep it open
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={logging}
            onClick={(e) => void log('FOLLOW_UP', { jobApplicationId: application.id }, e.currentTarget)}
            className={ACTION_CLASS}
          >
            I followed up
          </button>
          {snoozeAndDismiss(remind, remindLabel, () => setFollowUp(application.id, null))}
        </>
      );
  } else if (nudge.kind === 'QUIET_APPLICATION' && nudge.jobApplication && nudge.since) {
    const application = nudge.jobApplication;
    title = `No news from ${application.company} in ${weeksSince(nudge.since, today)}`;
    body = 'A short follow-up keeps you on their radar.';
    buttons = (
      <>
        <button
          type="button"
          disabled={logging}
          onClick={(e) => void log('FOLLOW_UP', { jobApplicationId: application.id }, e.currentTarget)}
          className={ACTION_CLASS}
        >
          I followed up
        </button>
        {snoozeAndDismiss(() => hide(true), 'Snooze for a week', () => hide(false))}
      </>
    );
  } else if (nudge.kind === 'QUIET_CONTACT' && nudge.contact && nudge.since) {
    const contact = nudge.contact;
    title = contact.lastContactedOn
      ? `You haven't talked to ${contact.name} in ${weeksSince(nudge.since, today)}`
      : `You added ${contact.name} ${weeksSince(nudge.since, today)} ago`;
    body = 'A quick hello keeps the connection warm.';
    buttons = (
      <>
        <button
          type="button"
          disabled={logging}
          onClick={(e) => void log('NETWORKING_MESSAGE', { contactId: contact.id }, e.currentTarget)}
          className={ACTION_CLASS}
        >
          I reached out
        </button>
        {snoozeAndDismiss(() => hide(true), 'Snooze for a week', () => hide(false))}
      </>
    );
  } else {
    return null;
  }

  return (
    <li className={`${phoneHidden ? 'hidden sm:flex' : 'flex'} flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl bg-stone-100 py-2 pr-1.5 pl-3 dark:bg-stone-800/60`}>
      <span className="flex min-w-0 flex-1 basis-56 items-start gap-2">
        <BellIcon className="mt-0.5 shrink-0 text-brand-500" />
        <span className="min-w-0">
          <span className="block text-sm font-extrabold">{title}</span>
          <span className="block text-xs text-stone-500 dark:text-stone-400">{body}</span>
        </span>
      </span>
      <span className="ml-auto flex flex-wrap items-center justify-end gap-0.5">{buttons}</span>
    </li>
  );
}
