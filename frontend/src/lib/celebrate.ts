import { burst, celebrateFullScreen } from './confetti';
import { playSound } from './sounds';
import type { StageKind } from './status';

// Decides what happens when an application moves forward (or gets a no), and
// tells the toaster what to say. Effort is celebrated; rejections get kindness.

export type ToastTone = 'celebrate' | 'big' | 'gentle';
export type Toast = { id: number; tone: ToastTone; title: string; body: string };

type Listener = (toast: Toast) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function onToast(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(tone: ToastTone, title: string, body: string) {
  const toast = { id: nextId++, tone, title, body };
  listeners.forEach((listener) => listener(toast));
}

const MESSAGES = {
  applied: [
    ['Application sent', 'Every application is a door you opened.'],
    ['Another one out the door', 'That took real effort, and it counts.'],
    ['Nice work', "You put yourself out there. That's how it happens."],
    ['Sent', 'Your future self says thank you.'],
  ],
  interview: [
    ['You landed an interview', 'They want to meet you. Your work is paying off.'],
    ['Interview stage unlocked', "You're getting noticed. Time to shine."],
  ],
  nextRound: [
    ['On to the next round', "They liked what they saw. Keep going."],
    ['Another round', "You're moving forward. That's real progress."],
  ],
  offer: [
    ['You got an offer!', 'Every application, every interview, every step got you here.'],
    ['An offer!', 'Take a moment to really celebrate this one. You earned it.'],
  ],
  rejected: [
    ['Every rejection is progress', "It's one step closer to your next acceptance."],
    ["That's closure", 'And closure is progress. On to the next one.'],
    ['Not this one', "And that's okay. You showed up, and that counts."],
    ['A step, not a stop', 'Every no gets you closer to your yes.'],
    ['Their loss', 'Your next acceptance is out there. Keep going.'],
  ],
} as const;

const WIN_MESSAGES: Record<string, readonly (readonly [string, string])[]> = {
  NETWORKING_MESSAGE: [
    ['Message sent', 'Reaching out takes courage. Nice work.'],
    ['You put yourself out there', 'Most opportunities start with a message like that one.'],
  ],
  COFFEE_CHAT: [
    ['Coffee chat logged', 'Real conversations open real doors.'],
    ['Great conversation', "Every person you meet makes the next door easier to open."],
  ],
  FOLLOW_UP: [
    ['Follow-up sent', "Following up is how you stay top of mind."],
    ['Nicely done', 'A follow-up shows you care. People notice.'],
  ],
  TAILORED_MATERIALS: [
    ['Materials tailored', 'A tailored resume stands out. That effort counts.'],
    ['Looking sharp', 'Putting your best foot forward, one application at a time.'],
  ],
  CUSTOM: [
    ['Logged', 'Every step counts, including the ones only you know about.'],
    ['Nice work', 'You showed up for your job hunt today.'],
  ],
};

/** A random [title, body] message from a list. */
function pick(items: readonly (readonly [string, string])[]): readonly [string, string] {
  return items[Math.floor(Math.random() * items.length)];
}

// How far along each kind is. Rejected sits at 0 so moving a card back out of
// "Rejected" into "Saved" doesn't celebrate.
const RANK: Record<StageKind, number> = { SAVED: 0, REJECTED: 0, APPLIED: 1, INTERVIEWING: 2, OFFER: 3 };

type Move = {
  from: { kind: StageKind; position: number } | null;
  to: { kind: StageKind; position: number };
  /** Where the confetti comes from, like the spot a card was dropped. Defaults to the middle of the screen. */
  origin?: { x: number; y: number };
};

/** Call after an application changes columns (or is created). */
export function celebrateMove({ from, to, origin }: Move) {
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;

  if (to.kind === 'REJECTED') {
    if (from?.kind === 'REJECTED') return;
    playSound('gentle');
    const [title, body] = pick(MESSAGES.rejected);
    showToast('gentle', title, body);
    return;
  }

  const fromRank = from ? RANK[from.kind] : 0;
  const toRank = RANK[to.kind];
  const laterInterviewRound =
    from?.kind === 'INTERVIEWING' && to.kind === 'INTERVIEWING' && to.position > from.position;

  if (toRank > fromRank || laterInterviewRound) {
    if (to.kind === 'OFFER') {
      playSound('offer');
      celebrateFullScreen();
      const [title, body] = pick(MESSAGES.offer);
      showToast('big', title, body);
    } else if (to.kind === 'INTERVIEWING') {
      playSound('interview');
      burst({ x, y, count: 110, spread: 100, power: 15 });
      const [title, body] = pick(laterInterviewRound ? MESSAGES.nextRound : MESSAGES.interview);
      showToast('celebrate', title, body);
    } else {
      playSound('applied');
      burst({ x, y, count: 55, spread: 70, power: 11 });
      const [title, body] = pick(MESSAGES.applied);
      showToast('celebrate', title, body);
    }
  }
}

const LET_GO_MESSAGES = [
  ['Let go, with grace', "You gave this one your best. That effort still counts."],
  ['Making room', "No reply isn't a verdict on you. Your energy is free for what's next."],
  ['That takes courage', 'Closing a door you held open is progress too.'],
  ['On to the next one', 'You followed up and did everything right. New doors are waiting.'],
] as const;

/** Letting go of an application that never wrote back. Kinder than the usual rejection messages. */
export function celebrateLetGo() {
  playSound('gentle');
  const [title, body] = pick(LET_GO_MESSAGES);
  showToast('gentle', title, body);
}

/** After you log a win on the Progress page. */
export function celebrateWin(kind: string, origin?: { x: number; y: number }) {
  playSound('applied');
  burst({ x: origin?.x ?? window.innerWidth / 2, y: origin?.y ?? window.innerHeight / 2, count: 50, spread: 70, power: 11 });
  const [title, body] = pick(WIN_MESSAGES[kind] ?? [['Logged', 'Every step counts.'] as const]);
  showToast('celebrate', title, body);
}

/** When a streak reaches a milestone like 7 or 30 days. */
export function celebrateStreakMilestone(days: number) {
  const big = days >= 30;
  playSound(big ? 'offer' : 'interview');
  if (big) celebrateFullScreen();
  else burst({ x: window.innerWidth / 2, y: window.innerHeight / 3, count: 120, spread: 120, power: 15 });
  const body =
    days >= 100
      ? "That's remarkable consistency. Be proud of this."
      : days >= 30
        ? 'A whole month of showing up. That is how job hunts are won.'
        : "You've shown up every day. Keep the fire going.";
  showToast('big', `${days}-day streak!`, body);
}

/** Finishing an interview round's prep checklist. */
export function celebratePrepped(company: string) {
  playSound('interview');
  burst({ x: window.innerWidth / 2, y: window.innerHeight / 2, count: 100, spread: 110, power: 14 });
  showToast('celebrate', "You're ready", `Your ${company} prep is done. Walk in knowing you did the work.`);
}

const PRACTICE_MESSAGES = {
  NAILED_IT: [
    ['Nailed it', 'That one will be ready when they ask.'],
    ['Smooth', "Every rep makes the real thing easier."],
  ],
  NEEDS_WORK: [
    ['Rep done', "Rough answers in practice mean smoother ones in the room."],
    ['Good practice', 'Finding the bumps now is exactly the point.'],
  ],
} as const;

/** One practice rep. Both ratings get encouragement: practicing is the win. */
export function celebratePractice(rating: 'NAILED_IT' | 'NEEDS_WORK') {
  playSound(rating === 'NAILED_IT' ? 'applied' : 'pop');
  const [title, body] = pick(PRACTICE_MESSAGES[rating]);
  showToast('celebrate', title, body);
}

/** A finished study session. */
export function celebrateStudy(minutes: number, topic: string) {
  playSound('applied');
  burst({ x: window.innerWidth / 2, y: window.innerHeight / 3, count: 60, spread: 80, power: 12 });
  showToast('celebrate', 'Session complete', `${minutes} focused minutes on ${topic}. That adds up.`);
}

const PERFECT_MESSAGES = [
  ['Perfect day!', 'Every goal done. That is exactly how it adds up.'],
  ['You did it all', 'Every goal checked off. Take a moment to enjoy that.'],
  ['Perfect day', 'You set the bar and cleared it. See you tomorrow.'],
] as const;

/** Finishing every one of today's goals. */
export function celebratePerfectDay(streak: number) {
  playSound('interview');
  burst({ x: window.innerWidth / 2, y: window.innerHeight / 3, count: 140, spread: 130, power: 16 });
  const [title, body] = pick(PERFECT_MESSAGES);
  showToast('big', title, streak > 1 ? `${body} That's ${streak} perfect days in a row.` : body);
}
