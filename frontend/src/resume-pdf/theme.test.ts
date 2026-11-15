import { describe, expect, it } from 'vitest';
import { DENSITIES, DEFAULT_STYLE } from '../lib/resume/style';
import { buildTheme } from './theme';

describe('buildTheme', () => {
  it('works out sizes for a new resume', () => {
    expect(buildTheme(DEFAULT_STYLE)).toEqual({
      body: 9.5,
      lineHeight: 1.35,
      name: 27,
      heading: 13,
      small: 8.5,
      margin: 32, // 0.45 inch
      sectionGap: 11,
      entryGap: 7.5,
      bulletGap: 2.5,
      accent: DEFAULT_STYLE.accent,
    });
  });

  it('rounds headings and small text to half points', () => {
    for (const density of DENSITIES) {
      const theme = buildTheme({ ...density.values, accent: '#000000' });
      for (const size of [theme.heading, theme.small, theme.entryGap, theme.bulletGap]) {
        expect(size * 2).toBe(Math.round(size * 2));
      }
    }
  });

  it('gets bigger from Tight to Normal to Roomy', () => {
    const [roomy, normal, tight] = DENSITIES.map((density) => buildTheme({ ...density.values, accent: '#000000' }));
    for (const key of ['body', 'name', 'margin', 'sectionGap', 'entryGap'] as const) {
      expect(tight[key]).toBeLessThanOrEqual(normal[key]);
      expect(normal[key]).toBeLessThanOrEqual(roomy[key]);
    }
  });
});
