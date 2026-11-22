import { describe, expect, it } from 'vitest';
import { SHOT_SIZES, shotSource, type Shot } from './landingShots';

describe('shotSource', () => {
  const shots = Object.keys(SHOT_SIZES) as Shot[];

  it('finds both sizes of every screenshot in light and dark', () => {
    for (const shot of shots) {
      for (const scheme of ['light', 'dark'] as const) {
        const { src, srcSet } = shotSource(shot, scheme);
        expect(src).toContain(`${shot}-${scheme}-`);
        expect(srcSet.split(', ')).toHaveLength(2);
      }
    }
  });

  it('lists the half-size file first, with each width', () => {
    expect(shotSource('board', 'dark').srcSet).toMatch(/board-dark-916\.webp 916w, .*board-dark-1832\.webp 1832w$/);
  });
});
