import { afterEach, describe, expect, it, vi } from 'vitest';
import { blankToNull, formatDate, formatMinutes, hoursDecimal, todayIso } from './format';

describe('formatDate', () => {
  it('keeps the date it was given, with no time zone slip', () => {
    // new Date('2026-10-25') would be midnight UTC, which is Oct 24 in Toronto.
    const text = formatDate('2026-10-25')!;
    expect(text).toContain('25');
    expect(text).toContain('2026');
    expect(text).not.toContain('24');
  });

  it('is null for a missing date', () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate(undefined)).toBeNull();
    expect(formatDate('')).toBeNull();
  });
});

describe('todayIso', () => {
  afterEach(() => vi.useRealTimers());

  it("is today's date on your own clock, late in the evening too", () => {
    // 11:30 PM in Toronto is already the next day in UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T04:30:00Z'));
    expect(todayIso()).toBe('2026-11-14');
  });

  it('pads months and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 12));
    expect(todayIso()).toBe('2026-01-05');
  });
});

describe('blankToNull', () => {
  it('turns empty and whitespace-only text into null', () => {
    expect(blankToNull('')).toBeNull();
    expect(blankToNull('   \n\t')).toBeNull();
  });

  it('trims text that has something in it', () => {
    expect(blankToNull('  Shopify ')).toBe('Shopify');
  });
});

describe('formatMinutes', () => {
  it.each([
    [0, '0 min'],
    [45, '45 min'],
    [59, '59 min'],
    [60, '1 h'],
    [120, '2 h'],
    [135, '2 h 15 min'],
  ])('%i minutes reads "%s"', (minutes, text) => {
    expect(formatMinutes(minutes)).toBe(text);
  });
});

describe('hoursDecimal', () => {
  it.each([
    [135, '2.3'],
    [120, '2'],
    [30, '0.5'],
    [600, '10'],
    [6_030, '101'],
  ])('%i minutes reads "%s" hours', (minutes, text) => {
    expect(hoursDecimal(minutes)).toBe(text);
  });
});
