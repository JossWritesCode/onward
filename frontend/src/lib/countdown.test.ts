import { describe, expect, it } from 'vitest';
import { describeInterviewTime, shortInterviewTime, toDateTimeLocal } from './countdown';

// Times are local (Toronto, from the test setup), the way the app shows them.
const now = new Date(2026, 10, 14, 15, 0); // Sat Nov 14, 3:00 PM
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute).toISOString();

describe('describeInterviewTime', () => {
  it('says "Today at" for later today', () => {
    expect(describeInterviewTime(at(14, 17), now)).toMatch(/^Today at /);
  });

  it('says "Earlier today" once it has passed', () => {
    expect(describeInterviewTime(at(14, 9), now)).toMatch(/^Earlier today at /);
  });

  it('says "Tomorrow at" for tomorrow, even early in the morning', () => {
    expect(describeInterviewTime(at(15, 8), now)).toMatch(/^Tomorrow at /);
  });

  it('counts calendar days, not 24-hour stretches', () => {
    // 9 AM Monday is less than 48 hours away, but two days from Saturday.
    expect(describeInterviewTime(at(16, 9), now)).toBe('In 2 days');
  });

  it('counts across the end of the month', () => {
    expect(describeInterviewTime(new Date(2026, 11, 2, 10).toISOString(), now)).toBe('In 18 days');
  });

  it('describes the past', () => {
    expect(describeInterviewTime(at(13, 10), now)).toBe('Yesterday');
    expect(describeInterviewTime(at(10, 10), now)).toBe('4 days ago');
  });

  it('counts days right across a daylight saving change', () => {
    // Clocks went back on Nov 1, 2026 in Toronto, so that day was 25 hours long.
    const before = new Date(2026, 9, 31, 12);
    expect(describeInterviewTime(new Date(2026, 10, 2, 12).toISOString(), before)).toBe('In 2 days');
  });
});

describe('shortInterviewTime', () => {
  it('shortens for board cards', () => {
    expect(shortInterviewTime(at(14, 17), now)).toBe('Interview today');
    expect(shortInterviewTime(at(15, 8), now)).toBe('Interview tomorrow');
    expect(shortInterviewTime(at(17, 8), now)).toBe('Interview in 3 days');
    expect(shortInterviewTime(at(13, 8), now)).toBe('Interview yesterday');
  });
});

describe('toDateTimeLocal', () => {
  it('gives the local time a datetime-local input expects', () => {
    expect(toDateTimeLocal(new Date(2026, 0, 5, 9, 7).toISOString())).toBe('2026-01-05T09:07');
  });

  it('turns an interview at 8 PM Toronto time back into 8 PM, not the UTC hour', () => {
    expect(toDateTimeLocal('2026-11-20T01:00:00Z')).toBe('2026-11-19T20:00');
  });

  it('is empty without a time', () => {
    expect(toDateTimeLocal(null)).toBe('');
    expect(toDateTimeLocal(undefined)).toBe('');
  });
});
