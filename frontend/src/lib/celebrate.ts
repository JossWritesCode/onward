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

function pick<T>(items: readonly T[]): T {
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
