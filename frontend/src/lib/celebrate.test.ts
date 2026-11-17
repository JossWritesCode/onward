import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { burst } from './confetti';
import { celebrateMove, noteUndone, onToast, type Toast } from './celebrate';

vi.mock('./confetti', () => ({ burst: vi.fn(), celebrateFullScreen: vi.fn() }));
vi.mock('./sounds', () => ({ playSound: vi.fn() }));

const origin = { x: 0, y: 0 };
const stage = (kind: 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED', position = 0) => ({ kind, position });

let toasts: Toast[];
let stop: () => void;
beforeEach(() => {
  toasts = [];
  stop = onToast((toast) => toasts.push(toast));
});
afterEach(() => {
  stop();
  vi.clearAllMocks();
});

describe('celebrateMove', () => {
  it('celebrates moving forward', () => {
    celebrateMove({ from: stage('SAVED'), to: stage('APPLIED'), origin });
    expect(toasts.map((toast) => toast.tone)).toEqual(['celebrate']);
    expect(burst).toHaveBeenCalled();
  });

  it('celebrates a later interview round', () => {
    celebrateMove({ from: stage('INTERVIEWING', 2), to: stage('INTERVIEWING', 3), origin });
    expect(toasts).toHaveLength(1);
  });

  it.each([
    ['APPLIED', 'SAVED'],
    ['INTERVIEWING', 'APPLIED'],
    ['OFFER', 'INTERVIEWING'],
  ] as const)('stays quiet moving back from %s to %s', (from, to) => {
    celebrateMove({ from: stage(from), to: stage(to), origin });
    expect(toasts).toEqual([]);
    expect(burst).not.toHaveBeenCalled();
  });

  it.each(['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER'] as const)(
    'stays quiet moving out of Rejected to %s: reopening a card is not a new win',
    (to) => {
      celebrateMove({ from: stage('REJECTED'), to: stage(to), origin });
      expect(toasts).toEqual([]);
      expect(burst).not.toHaveBeenCalled();
    },
  );

  it('is gentle about a rejection', () => {
    celebrateMove({ from: stage('APPLIED'), to: stage('REJECTED'), origin });
    expect(toasts.map((toast) => toast.tone)).toEqual(['gentle']);
    expect(burst).not.toHaveBeenCalled();
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
