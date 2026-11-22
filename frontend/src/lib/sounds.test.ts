import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { celebrateGoalsComplete, celebrateMove, resetFeedbackForTests } from './celebrate';
import { isMuted } from './preferences';
import { playSound, resetAudioForTests, soundLength, SOUNDS } from './sounds';

vi.mock('./preferences', () => ({ isMuted: vi.fn(() => false) }));

// A stand-in for the browser's AudioContext that counts how many tones start.
let started: { type: OscillatorType; freq: number }[];

class FakeAudioContext {
  currentTime = 0;
  state = 'running';
  destination = {};
  resume = vi.fn();
  createBiquadFilter() {
    return { type: '', frequency: { value: 0 }, Q: { value: 0 }, connect: (next: unknown) => next };
  }
  createGain() {
    const param = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
    return { gain: param, connect: (next: unknown) => next };
  }
  createOscillator() {
    const oscillator = {
      type: 'sine' as OscillatorType,
      frequency: { value: 0 },
      connect: (next: unknown) => next,
      start: () => started.push({ type: oscillator.type, freq: oscillator.frequency.value }),
      stop() {},
    };
    return oscillator;
  }
}

beforeEach(() => {
  started = [];
  resetAudioForTests();
  resetFeedbackForTests();
  vi.stubGlobal('window', { AudioContext: FakeAudioContext });
  vi.mocked(isMuted).mockReturnValue(false);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the cues', () => {
  it('keeps each one to its length: a short note, a bell of about a second, a chord under a second', () => {
    expect(soundLength('note')).toBeGreaterThanOrEqual(0.15);
    expect(soundLength('note')).toBeLessThanOrEqual(0.25);
    expect(soundLength('bell')).toBeGreaterThanOrEqual(1);
    expect(soundLength('bell')).toBeLessThanOrEqual(1.5);
    expect(soundLength('chord')).toBeLessThan(1);
  });

  it('uses soft sine tones with a gentle start, nothing harsh like a square wave', () => {
    playSound('note');
    playSound('bell');
    playSound('chord');
    expect(started.length).toBeGreaterThan(0);
    expect(new Set(started.map((tone) => tone.type))).toEqual(new Set(['sine']));
    for (const sound of Object.values(SOUNDS)) {
      for (const tone of sound.tones) expect(tone.attack).toBeGreaterThanOrEqual(0.01);
    }
  });

  it('makes the chord from two notes', () => {
    playSound('chord');
    const mainPitches = SOUNDS.chord.tones.filter((tone) => tone.gain > 0.5).map((tone) => tone.freq);
    expect(new Set(mainPitches).size).toBe(2);
  });
});

describe('an application that also finishes today\'s goals', () => {
  it('plays exactly one sound when sound is on', () => {
    celebrateMove({ from: { kind: 'SAVED', position: 0 }, to: { kind: 'APPLIED', position: 1 } });
    celebrateGoalsComplete(2);
    // One soft note: the felt-piano strike and its overtones, and nothing after it.
    expect(started).toHaveLength(SOUNDS.note.tones.length);
    expect(started[0].freq).toBe(SOUNDS.note.tones[0].freq);
  });

  it('stays silent when muted', () => {
    vi.mocked(isMuted).mockReturnValue(true);
    celebrateMove({ from: { kind: 'SAVED', position: 0 }, to: { kind: 'APPLIED', position: 1 } });
    celebrateGoalsComplete(2);
    expect(started).toEqual([]);
  });
});
