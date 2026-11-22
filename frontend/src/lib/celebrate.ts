import { playSound, type SoundName } from './sounds';
import type { StageKind } from './status';
import { undoneMessage } from './undo';

// Decides what happens after you do something for your job hunt, and tells
// the toaster what to say. Effort is acknowledged; rejections get kindness.
//
// One action gets one cue. Sending an application can also finish today's
// goals and reach a streak milestone, but those arrive a moment later (once
// the server has counted them) and join the toast that's already showing as
// a short extra line, with no second sound.

export type ToastTone = 'celebrate' | 'big' | 'gentle' | 'error';
/** A button on a toast, like "Log a win". The toast closes when it's pressed. */
export type ToastAction = { label: string; onClick: () => void };
export type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  body: string;
  action?: ToastAction;
  /** Extra lines added after the toast first showed, like "Today's goals are complete." */
  notes?: string[];
};

type Listener = (toast: Toast) => void;
const listeners = new Set<Listener>();
let nextId = 1;

/** Called with every new toast, and again with the same id when one gains a note. */
export function onToast(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(toast: Toast) {
  listeners.forEach((listener) => listener(toast));
}

/** Shows a toast with no sound. Returns it, so a later note can join it. */
export function showToast(tone: ToastTone, title: string, body: string, action?: ToastAction) {
  const toast: Toast = { id: nextId++, tone, title, body, action };
  emit(toast);
  return toast;
}

/**
 * How long after an action its follow-ons (goals finished, a streak
 * milestone) still count as part of it. Long enough for the server to answer
 * on a slow connection.
 */
export const FOLLOW_ON_MS = 8000;

let latest: { toast: Toast; at: number } | null = null;

/** For tests: forget the last action. */
export function resetFeedbackForTests() {
  latest = null;
}

/** The feedback for one thing you did: at most one sound, and one toast. */
function acknowledge(sound: SoundName | null, tone: ToastTone, title: string, body: string, action?: ToastAction) {
  if (sound) playSound(sound);
  const toast = showToast(tone, title, body, action);
  latest = { toast, at: Date.now() };
}

/**
 * Something that happened because of an action, like finishing today's goals.
 * It joins the action's toast as a note when there's one from just now, and
 * otherwise gets a toast of its own. Either way it never plays a sound, so
 * one action never stacks cues.
 */
function followOn(note: string, title: string, body: string) {
  if (latest && Date.now() - latest.at < FOLLOW_ON_MS) {
    const toast = { ...latest.toast, notes: [...(latest.toast.notes ?? []), note] };
    latest.toast = toast;
    emit(toast);
    return;
  }
  const toast = showToast('celebrate', title, body);
  latest = { toast, at: Date.now() };
}

const MESSAGES = {
  applied: [
    ['Application sent', 'Every application is a door you opened.'],
    ['Application sent', 'That took real effort, and it counts.'],
    ['Application sent', "You put yourself out there. That's how it happens."],
  ],
  interview: [
    ['Interview recorded', 'They want to meet you. Your work is paying off.'],
    ['Interview recorded', 'Time to get ready. Your prep checklist is waiting.'],
  ],
  nextRound: [
    ['On to the next round', 'They liked what they saw. Keep going.'],
    ['Next round recorded', "You're moving forward. That's real progress."],
  ],
  offer: [
    ['You got an offer', 'Every application, every interview, every step got you here.'],
    ['Offer recorded', 'Take a moment to really enjoy this one. You earned it.'],
  ],
  rejected: [
    ['That one is closed', "Closure is progress too. On to the next one."],
    ['Not this one', "And that's okay. You showed up, and that counts."],
    ['A step, not a stop', 'Every no gets you closer to your yes.'],
  ],
} as const;

const WIN_MESSAGES: Record<string, readonly (readonly [string, string])[]> = {
  NETWORKING_MESSAGE: [
    ['Message logged', 'Reaching out takes courage. Nice work.'],
    ['Message logged', 'Most opportunities start with a message like that one.'],
  ],
  COFFEE_CHAT: [
    ['Coffee chat logged', 'Real conversations open real doors.'],
    ['Coffee chat logged', 'Every person you meet makes the next door easier to open.'],
  ],
  FOLLOW_UP: [
    ['Follow-up logged', 'Following up is how you stay top of mind.'],
    ['Follow-up logged', 'A follow-up shows you care. People notice.'],
  ],
  TAILORED_MATERIALS: [
    ['Tailoring logged', 'A tailored resume stands out. That effort counts.'],
    ['Tailoring logged', 'Putting your best foot forward, one application at a time.'],
  ],
  CUSTOM: [
    ['Logged', 'Every step counts, including the ones only you know about.'],
    ['Logged', 'You showed up for your job hunt today.'],
  ],
};

/** A random [title, body] message from a list. */
function pick(items: readonly (readonly [string, string])[]): readonly [string, string] {
  return items[Math.floor(Math.random() * items.length)];
}

// How far along each kind is. Rejected ranks last, so moving a card out of it
// is a move back, never a new win to celebrate.
const RANK: Record<StageKind, number> = { SAVED: 0, APPLIED: 1, INTERVIEWING: 2, OFFER: 3, REJECTED: 4 };

type Move = {
  from: { kind: StageKind; position: number } | null;
  to: { kind: StageKind; position: number };
};

/**
 * Call after an application changes columns (or is created). Returns what it
 * acknowledged, so the board can highlight a card that just got an offer.
 */
export function celebrateMove({ from, to }: Move): 'applied' | 'interview' | 'offer' | 'rejected' | null {
  // A move that isn't a step forward, like moving a card back, gets a tiny tap
  // and no toast. A brand new card that isn't a step forward makes no sound.
  const routine = () => {
    if (from) playSound('tap');
    return null;
  };

  if (to.kind === 'REJECTED') {
    if (from?.kind === 'REJECTED') return routine();
    const [title, body] = pick(MESSAGES.rejected);
    acknowledge('settle', 'gentle', title, body);
    return 'rejected';
  }

  const fromRank = from ? RANK[from.kind] : 0;
  const toRank = RANK[to.kind];
  const laterInterviewRound =
    from?.kind === 'INTERVIEWING' && to.kind === 'INTERVIEWING' && to.position > from.position;
  if (toRank <= fromRank && !laterInterviewRound) return routine();

  if (to.kind === 'OFFER') {
    const [title, body] = pick(MESSAGES.offer);
    acknowledge('chord', 'big', title, body);
    return 'offer';
  }
  if (to.kind === 'INTERVIEWING') {
    const [title, body] = pick(laterInterviewRound ? MESSAGES.nextRound : MESSAGES.interview);
    acknowledge('rise', 'celebrate', title, body);
    return 'interview';
  }
  const [title, body] = pick(MESSAGES.applied);
  acknowledge('note', 'celebrate', title, body);
  return 'applied';
}

/**
 * Call with a move's `undone` answer from the server. When moving a card back
 * took back what a mistaken move recorded, says so quietly.
 */
export function noteUndone(kinds: readonly string[] | null | undefined) {
  const message = undoneMessage(kinds);
  if (message) showToast('gentle', message.title, message.body);
}

const LET_GO_MESSAGES = [
  ['Let go, with grace', 'You gave this one your best. That effort still counts.'],
  ['Making room', "No reply isn't a verdict on you. Your energy is free for what's next."],
  ['That takes courage', 'Closing a door you held open is progress too.'],
] as const;

/** Letting go of an application that never wrote back. Kinder than the usual rejection messages. */
export function celebrateLetGo() {
  const [title, body] = pick(LET_GO_MESSAGES);
  acknowledge('settle', 'gentle', title, body);
}

/** After you log effort that doesn't happen on the board, like a follow-up. */
export function celebrateWin(kind: string) {
  const [title, body] = pick(WIN_MESSAGES[kind] ?? [['Logged', 'Every step counts.'] as const]);
  acknowledge('note', 'celebrate', title, body);
}

/** Finishing an interview round's prep checklist. */
export function celebratePrepped(company: string) {
  acknowledge('note', 'celebrate', 'Prep checklist complete', `Your ${company} prep is done. Walk in knowing you did the work.`);
}

const PRACTICE_MESSAGES = {
  NAILED_IT: [
    ['Practice logged', 'That one will be ready when they ask.'],
    ['Practice logged', 'Every rep makes the real thing easier.'],
  ],
  NEEDS_WORK: [
    ['Practice logged', 'Rough answers in practice mean smoother ones in the room.'],
    ['Practice logged', 'Finding the bumps now is exactly the point.'],
  ],
} as const;

/** One practice rep. Both ratings get encouragement: practicing is the win. Shown, not heard. */
export function celebratePractice(rating: 'NAILED_IT' | 'NEEDS_WORK') {
  const [title, body] = pick(PRACTICE_MESSAGES[rating]);
  acknowledge(null, 'celebrate', title, body);
}

/** Starting the study timer: a soft chime to settle in. The running timer is the on-screen sign. */
export function studyStarted() {
  playSound('chime');
}

/**
 * Study time that counted. A session that ran on the timer rings the bell;
 * time added by hand is logged effort, so it gets the usual note.
 */
export function celebrateStudy(minutes: number, topic: string, { timer = true }: { timer?: boolean } = {}) {
  acknowledge(
    timer ? 'bell' : 'note',
    'celebrate',
    timer ? 'Study session complete' : 'Study time logged',
    `${minutes} focused minutes on ${topic}. That adds up.`,
  );
}

/** "Goals completed 3 days in a row", or "Goals completed for 1 day". */
export function goalsStreakLabel(days: number) {
  return days === 1 ? 'Goals completed for 1 day' : `Goals completed ${days} days in a row`;
}

/** Finishing the last of today's goals. */
export function celebrateGoalsComplete(streak: number) {
  const inARow = streak > 1 ? ` That's ${streak} days in a row.` : '';
  followOn(
    `Today's goals are complete.${inARow}`,
    "Today's goals are complete",
    streak > 1 ? `${goalsStreakLabel(streak)}. Nice work showing up for yourself.` : 'Every goal is checked off. See you tomorrow.',
  );
}

/** When a streak reaches a milestone like 7 or 30 days. */
export function celebrateStreakMilestone(days: number) {
  const body =
    days >= 100
      ? "That's remarkable consistency. Be proud of this."
      : days >= 30
        ? 'A whole month of showing up for yourself.'
        : "You've shown up every day. Keep going at your own pace.";
  followOn(`That's a ${days}-day streak.`, `${days}-day streak`, body);
}
