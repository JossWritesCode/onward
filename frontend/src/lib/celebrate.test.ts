import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  celebrateGoalsComplete,
  celebrateMove,
  celebratePractice,
  celebrateStreakMilestone,
  celebrateStudy,
  celebrateWin,
  FOLLOW_ON_MS,
  noteUndone,
  onToast,
  resetFeedbackForTests,
  type Toast,
} from './celebrate';
import { playSound } from './sounds';

vi.mock('./sounds', () => ({ playSound: vi.fn() }));

const stage = (kind: 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED', position = 0) => ({ kind, position });

let toasts: Toast[];
let stop: () => void;
beforeEach(() => {
  toasts = [];
  stop = onToast((toast) => toasts.push(toast));
  resetFeedbackForTests();
});
afterEach(() => {
  stop();
  vi.clearAllMocks();
  vi.useRealTimers();
});

/** The toasts on screen: a toast seen again with the same id replaces the earlier copy. */
const onScreen = () => [...new Map(toasts.map((toast) => [toast.id, toast])).values()];

describe('celebrateMove', () => {
  it('plays one soft note for an application sent', () => {
    celebrateMove({ from: stage('SAVED'), to: stage('APPLIED') });
    expect(playSound).toHaveBeenCalledExactlyOnceWith('note');
    expect(onScreen()).toMatchObject([{ tone: 'celebrate', title: 'Application sent' }]);
  });

  it('plays the warm chord for an offer, with a positive toast', () => {
    expect(celebrateMove({ from: stage('INTERVIEWING'), to: stage('OFFER') })).toBe('offer');
    expect(playSound).toHaveBeenCalledExactlyOnceWith('chord');
    expect(onScreen()).toMatchObject([{ tone: 'big' }]);
  });

  it.each([
    ['a new interview', stage('APPLIED'), stage('INTERVIEWING')],
    ['a later interview round', stage('INTERVIEWING', 2), stage('INTERVIEWING', 3)],
    ['a rejection', stage('APPLIED'), stage('REJECTED')],
  ])('shows %s without a sound', (_, from, to) => {
    celebrateMove({ from, to });
    expect(onScreen()).toHaveLength(1);
    expect(playSound).not.toHaveBeenCalled();
  });

  it.each([
    ['APPLIED', 'SAVED'],
    ['INTERVIEWING', 'APPLIED'],
    ['OFFER', 'INTERVIEWING'],
  ] as const)('stays quiet moving back from %s to %s', (from, to) => {
    expect(celebrateMove({ from: stage(from), to: stage(to) })).toBeNull();
    expect(toasts).toEqual([]);
    expect(playSound).not.toHaveBeenCalled();
  });

  it.each(['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER'] as const)(
    'stays quiet moving out of Rejected to %s: reopening a card is not a new win',
    (to) => {
      celebrateMove({ from: stage('REJECTED'), to: stage(to) });
      expect(toasts).toEqual([]);
      expect(playSound).not.toHaveBeenCalled();
    },
  );
});

describe('one action, one cue', () => {
  it('folds finished goals and a streak milestone into the application toast, with one sound', () => {
    celebrateMove({ from: stage('SAVED'), to: stage('APPLIED') });
    // The server's answer arrives a moment later.
    celebrateGoalsComplete(3);
    celebrateStreakMilestone(7);

    expect(playSound).toHaveBeenCalledTimes(1);
    const shown = onScreen();
    expect(shown).toHaveLength(1);
    expect(shown[0]).toMatchObject({
      title: 'Application sent',
      notes: ["Today's goals are complete. That's 3 days in a row.", "That's a 7-day streak."],
    });
  });

  it('gives finished goals their own quiet toast when nothing just happened', () => {
    vi.useFakeTimers();
    celebrateWin('FOLLOW_UP');
    vi.advanceTimersByTime(FOLLOW_ON_MS + 1);
    celebrateGoalsComplete(1);

    expect(playSound).toHaveBeenCalledTimes(1);
    expect(onScreen().map((toast) => toast.title)).toEqual(['Follow-up logged', "Today's goals are complete"]);
  });

  it('never uses the old "perfect day" wording', () => {
    celebrateGoalsComplete(4);
    celebrateMove({ from: stage('SAVED'), to: stage('APPLIED') });
    celebrateGoalsComplete(5);
    expect(JSON.stringify(toasts)).not.toMatch(/perfect/i);
  });
});

describe('other effort', () => {
  it('rings the bell for a finished study session, and plays the note for time added by hand', () => {
    celebrateStudy(25, 'System design');
    celebrateStudy(30, 'Algorithms', { timer: false });
    expect(vi.mocked(playSound).mock.calls).toEqual([['bell'], ['note']]);
  });

  it('shows practice ratings without a sound', () => {
    celebratePractice('NAILED_IT');
    celebratePractice('NEEDS_WORK');
    expect(onScreen()).toHaveLength(2);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('says what was logged', () => {
    celebrateWin('FOLLOW_UP');
    expect(onScreen()[0].title).toBe('Follow-up logged');
  });
});

describe('noteUndone', () => {
  it('shows a quiet note when a move took something back', () => {
    noteUndone(['INTERVIEW']);
    expect(toasts).toMatchObject([{ tone: 'gentle', title: 'Moved back', body: "That won't count as an interview." }]);
  });

  it('shows nothing otherwise', () => {
    noteUndone([]);
    noteUndone(undefined);
    expect(toasts).toEqual([]);
  });
});
