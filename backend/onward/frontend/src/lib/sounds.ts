import { isMuted } from './preferences';

// Every sound is generated in the browser with the Web Audio API, so there
// are no audio files to download or license.

type Note = {
  /** Frequency in Hz. */
  freq: number;
  /** Seconds after the sound starts. */
  at: number;
  /** Seconds the note lasts. */
  length: number;
  type?: OscillatorType;
  volume?: number;
};

export type SoundName = 'applied' | 'interview' | 'offer' | 'gentle' | 'pop';

// Note frequencies, rounded.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const A4 = 440;
const F4 = 349.23;
const C6 = 1046.5;
const E6 = 1318.5;
const G4 = 392;

const SOUNDS: Record<SoundName, Note[]> = {
  // A bright two-note chime.
  applied: [
    { freq: G5, at: 0, length: 0.14 },
    { freq: C6, at: 0.1, length: 0.35 },
  ],
  // A rising arpeggio.
  interview: [
    { freq: C5, at: 0, length: 0.14 },
    { freq: E5, at: 0.09, length: 0.14 },
    { freq: G5, at: 0.18, length: 0.14 },
    { freq: C6, at: 0.27, length: 0.5 },
  ],
  // A little fanfare.
  offer: [
    { freq: G4, at: 0, length: 0.16, type: 'square', volume: 0.06 },
    { freq: C5, at: 0.14, length: 0.16, type: 'square', volume: 0.06 },
    { freq: E5, at: 0.28, length: 0.16, type: 'square', volume: 0.06 },
    { freq: G5, at: 0.42, length: 0.3, type: 'square', volume: 0.06 },
    { freq: E5, at: 0.72, length: 0.12, type: 'square', volume: 0.06 },
    { freq: G5, at: 0.84, length: 0.12 },
    { freq: C6, at: 0.84, length: 0.8 },
    { freq: E6, at: 0.84, length: 0.8, volume: 0.05 },
  ],
  // Soft and warm, for rejections. Rising, so it doesn't sound like a "fail" buzzer.
  gentle: [
    { freq: F4, at: 0, length: 0.4, type: 'sine', volume: 0.1 },
    { freq: A4, at: 0.18, length: 0.6, type: 'sine', volume: 0.1 },
  ],
  // A tiny click for small moments, like dropping a card.
  pop: [{ freq: 880, at: 0, length: 0.06, type: 'sine', volume: 0.06 }],
};

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

export function playSound(name: SoundName) {
  if (isMuted()) return;
  try {
    const ctx = audioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const start = ctx.currentTime + 0.01;
    for (const note of SOUNDS[name]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const volume = note.volume ?? 0.12;
      const begin = start + note.at;
      const end = begin + note.length;

      oscillator.type = note.type ?? 'triangle';
      oscillator.frequency.value = note.freq;
      // Quick fade in and a smooth fade out, so notes don't click.
      gain.gain.setValueAtTime(0, begin);
      gain.gain.linearRampToValueAtTime(volume, begin + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(begin);
      oscillator.stop(end + 0.05);
    }
  } catch {
    // Sound is a nice extra; never let it break anything.
  }
}
