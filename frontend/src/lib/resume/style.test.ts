import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE, DENSITIES, densityOf, toStyleValues } from './style';

describe('densityOf', () => {
  it('recognises each density', () => {
    for (const density of DENSITIES) {
      expect(densityOf({ ...density.values, accent: '#000000' })).toBe(density.id);
    }
  });

  it('a new resume starts at Normal', () => {
    expect(densityOf(DEFAULT_STYLE)).toBe('normal');
  });

  it('is null once any value is fine-tuned away', () => {
    expect(densityOf({ ...DEFAULT_STYLE, sectionGap: 12 })).toBeNull();
    expect(densityOf({ ...DEFAULT_STYLE, lineHeight: 1.4 })).toBeNull();
  });

  it('ignores the accent colour', () => {
    expect(densityOf({ ...DEFAULT_STYLE, accent: '#be123c' })).toBe('normal');
  });

  it('tolerates floating-point noise from the API', () => {
    expect(densityOf({ ...DEFAULT_STYLE, lineHeight: 1.35 + 1e-9 })).toBe('normal');
  });
});

it('toStyleValues keeps the five values and drops anything else, like __typename', () => {
  const fromApi = { ...DEFAULT_STYLE, __typename: 'ResumeStyle', id: '7' };
  expect(toStyleValues(fromApi)).toEqual(DEFAULT_STYLE);
});
