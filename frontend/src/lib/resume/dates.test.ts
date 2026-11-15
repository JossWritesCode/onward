import { describe, expect, it } from 'vitest';
import { formatResumeDate, formatResumeDateRange } from './dates';

describe('formatResumeDate', () => {
  it.each([
    ['2024-01', "Jan '24"],
    ['2019-6', "Jun '19"],
    ['2009-12', "Dec '09"],
    [' 2024-03 ', "Mar '24"],
  ])('"%s" reads "%s"', (date, text) => {
    expect(formatResumeDate(date)).toBe(text);
  });

  it.each(['Present', '2023', 'Summer 2022', ''])('leaves "%s" as written', (date) => {
    expect(formatResumeDate(date)).toBe(date);
  });

  it('leaves a month that does not exist as written', () => {
    expect(formatResumeDate('2024-13')).toBe('2024-13');
    expect(formatResumeDate('2024-00')).toBe('2024-00');
  });
});

describe('formatResumeDateRange', () => {
  it('joins the two ends', () => {
    expect(formatResumeDateRange('2022-08', 'Present')).toBe("Aug '22 - Present");
  });

  it('shows just one date when the other is blank', () => {
    expect(formatResumeDateRange('2022-08', '')).toBe("Aug '22");
    expect(formatResumeDateRange('', '2023')).toBe('2023');
    expect(formatResumeDateRange('', '')).toBe('');
  });
});
