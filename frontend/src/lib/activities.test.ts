import { describe, expect, it } from 'vitest';
import { activityLabel, activitySource, addDays, formatDay, mondayOf, parseIso, plural, toIso } from './activities';

describe('day math', () => {
  it('reads and writes YYYY-MM-DD without moving the day', () => {
    expect(toIso(parseIso('2026-11-14'))).toBe('2026-11-14');
  });

  it('adds days across months, years, and leap days', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is not thrown off by daylight saving changes', () => {
    // Toronto's clocks change on these days. Each step is still exactly one day.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-01-01', 365)).toBe('2027-01-01');
  });

  it('finds the Monday a week starts on', () => {
    expect(mondayOf('2026-11-16')).toBe('2026-11-16'); // a Monday
    expect(mondayOf('2026-11-14')).toBe('2026-11-09'); // Saturday
    expect(mondayOf('2026-11-15')).toBe('2026-11-09'); // Sunday ends the week
    expect(mondayOf('2027-01-01')).toBe('2026-12-28'); // across a year
  });

  it('formats a day as the date it is, not the UTC day before', () => {
    expect(formatDay('2026-11-14')).toContain('14');
  });
});

describe('plural', () => {
  it('uses the right word for the count', () => {
    expect(plural(0, 'job')).toBe('0 jobs');
    expect(plural(1, 'job')).toBe('1 job');
    expect(plural(2, 'coffee chat')).toBe('2 coffee chats');
    expect(plural(3, 'resume or cover letter', 'resumes or cover letters')).toBe('3 resumes or cover letters');
  });
});

describe('activityLabel', () => {
  it('uses the built-in label', () => {
    expect(activityLabel({ kind: 'COFFEE_CHAT' })).toBe('Had a coffee chat');
    expect(activityLabel({ kind: 'REJECTION' })).toBe('Closure');
  });

  it("uses a custom action's own name", () => {
    expect(activityLabel({ kind: 'CUSTOM', customAction: { name: 'Went to a meetup' } })).toBe('Went to a meetup');
  });

  it('falls back when a custom action is missing', () => {
    expect(activityLabel({ kind: 'CUSTOM', customAction: null })).toBe('Custom action');
  });
});

describe('activitySource', () => {
  it('says where automatic activities came from', () => {
    expect(activitySource('APPLICATION_SENT')).toBe('from your board');
    expect(activitySource('OFFER')).toBe('from your board');
    expect(activitySource('LEETCODE')).toBe('from LeetCode');
    expect(activitySource('STUDY_SESSION')).toBe('from Prep');
  });
});
