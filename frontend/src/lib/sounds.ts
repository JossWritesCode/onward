import { isMuted } from './preferences';

// Every sound is made in the browser with the Web Audio API, so there are no
// audio files to download or license. Each one is a few soft sine tones: a
// slow start so nothing clicks, low and warm pitches, and a long, gentle fade.
// Onward plays sound only for meaningful moments. Everything else is shown on
// screen instead, so the app makes sense with sound off.

export type SoundName =
  /** One quiet felt-piano note: an application sent, or effort logged. */
  | 'note'
  /** A mellow bell that rings out: a study session finished. */
  | 'bell'
  /** A warm two-note chord: an offer. */
  | 'chord';

/** One sine tone inside a sound. Overtones are tones at a multiple of the main pitch. */
export type Tone = {
  /** Frequency in Hz. */
  freq: number;
  /** Seconds after the sound starts. */
  at: number;
  /** Peak volume, from 0 to 1, before the overall volume. */
  gain: number;
  /** Seconds to rise to the peak. Longer feels softer. */
  attack: number;
  /** Seconds from the peak until it has faded to silence. */
  decay: number;
};

// Pitches, rounded. All sit in the warm middle of the keyboard.
const F4 = 349.23;
const G4 = 392;
const A4 = 440;

/** A felt-piano strike: the main pitch with a couple of quiet overtones that fade first. */
function feltNote(freq: number, at: number, decay: number, gain = 1): Tone[] {
  return [
    { freq, at, gain, attack: 0.012, decay },
    { freq: freq * 2, at, gain: gain * 0.22, attack: 0.01, decay: decay * 0.55 },
    { freq: freq * 3, at, gain: gain * 0.06, attack: 0.01, decay: decay * 0.35 },
  ];
}

export const SOUNDS: Record<SoundName, { tones: Tone[]; volume: number; brightness: number }> = {
  // About 220 ms: a single G, muffled like a piano with felt on the strings.
  note: { tones: feltNote(G4, 0, 0.21), volume: 0.2, brightness: 1400 },
  // About 1.4 s: a singing-bowl style bell. The uneven overtone (2.76 times the
  // pitch) is what makes a bell sound like a bell, and the twin tone a hair
  // higher gives it a slow, calm shimmer as it fades.
  bell: {
    tones: [
      { freq: G4, at: 0, gain: 1, attack: 0.02, decay: 1.38 },
      { freq: G4 + 1.4, at: 0, gain: 0.45, attack: 0.02, decay: 1.3 },
      { freq: G4 * 2.76, at: 0, gain: 0.22, attack: 0.015, decay: 0.8 },
      { freq: G4 * 5.4, at: 0, gain: 0.05, attack: 0.01, decay: 0.35 },
    ],
    volume: 0.16,
    brightness: 2600,
  },
  // About 0.85 s: F and A together, the A just after, like a gently rolled chord.
  chord: {
    tones: [...feltNote(F4, 0, 0.78, 0.9), ...feltNote(A4, 0.05, 0.8, 0.75)],
    volume: 0.18,
    brightness: 1600,
  },
};

/** How long a sound lasts, in seconds, from its first tone to the end of its last fade. */
export function soundLength(name: SoundName) {
  return Math.max(...SOUNDS[name].tones.map((tone) => tone.at + tone.attack + tone.decay));
}

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

/** For tests: forget the audio context, so a new fake one is used. */
export function resetAudioForTests() {
  context = null;
}

export function playSound(name: SoundName) {
  if (isMuted()) return;
  try {
    const ctx = audioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const sound = SOUNDS[name];
    const start = ctx.currentTime + 0.01;

    // A gentle low-pass filter takes the edge off, so tones sound soft rather than electronic.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = sound.brightness;
    filter.Q.value = 0.5;
    const master = ctx.createGain();
    master.gain.value = sound.volume;
    filter.connect(master).connect(ctx.destination);

    for (const tone of sound.tones) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const begin = start + tone.at;
      const peak = begin + tone.attack;
      const end = peak + tone.decay;

      oscillator.type = 'sine';
      oscillator.frequency.value = tone.freq;
      gain.gain.setValueAtTime(0, begin);
      gain.gain.linearRampToValueAtTime(tone.gain, peak);
      // A curved fade sounds natural, like a struck note dying away.
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain).connect(filter);
      oscillator.start(begin);
      oscillator.stop(end + 0.05);
    }
  } catch {
    // Sound is a nice extra; never let it break anything.
  }
}
