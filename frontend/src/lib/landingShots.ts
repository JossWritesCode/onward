import type { Scheme } from './theme';

// The screenshots on the landing page. They're crops of the real app filled
// with made-up sample data, saved in src/assets/landing as WebP. Each one
// comes in light and dark, at full size (for sharp screens) and half size.
// A file is named for its screenshot, its scheme and its width in pixels,
// like board-light-1832.webp.

const FILES = import.meta.glob<string>('../assets/landing/*.webp', { eager: true, query: '?url', import: 'default' });

/** Each screenshot's full size in pixels. The half-size file is half as wide. */
export const SHOT_SIZES = {
  // The board's first three columns, for the hero on wider screens.
  board: [1832, 836],
  // The top card of each of those columns, for the hero on phones.
  'stage-saved': [864, 441],
  'stage-applied': [864, 585],
  'stage-interview': [864, 717],
  // One application card with its resume and follow-up date.
  card: [864, 594],
  // Tailoring a resume with your own AI: the message copied, the reply pasted back. Also at phone width.
  tailor: [1416, 1986],
  'tailor-phone': [1146, 2118],
  // An interview's prep checklist and a practice prompt, each also at phone width.
  checklist: [1416, 1149],
  'checklist-phone': [1146, 1581],
  prompt: [1410, 537],
  'prompt-phone': [1140, 537],
  // The switch in Settings that turns on the software engineering track.
  engineering: [1440, 633],
  // This week's recap with the first few steps under it, and the recap as it looks on a phone.
  progress: [1560, 1748],
  'progress-phone': [1134, 1464],
} as const satisfies Record<string, readonly [number, number]>;

export type Shot = keyof typeof SHOT_SIZES;

export type ShotSource = { src: string; srcSet: string; width: number; height: number };

/** The files for a screenshot in light or dark, ready for an <img> or <source>. */
export function shotSource(shot: Shot, scheme: Scheme): ShotSource {
  const [width, height] = SHOT_SIZES[shot];
  const half = Math.round(width / 2);
  const url = (pixels: number) => {
    const file = FILES[`../assets/landing/${shot}-${scheme}-${pixels}.webp`];
    if (!file) throw new Error(`Missing landing screenshot ${shot}-${scheme}-${pixels}.webp`);
    return file;
  };
  return { src: url(half), srcSet: `${url(half)} ${half}w, ${url(width)} ${width}w`, width, height };
}
