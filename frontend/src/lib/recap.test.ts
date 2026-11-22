import { describe, expect, it } from 'vitest';
import { countWeek, recapStats, recapText } from './recap';

const activity = (occurredOn: string, kind: string, category = 'APPLYING', company?: string) => ({
  occurredOn,
  kind,
  category,
  jobApplication: company ? { company } : null,
});

const activities = [
  activity('2026-11-16', 'APPLICATION_SENT', 'APPLYING', 'Brightline'),
  activity('2026-11-17', 'APPLICATION_SENT', 'APPLYING', 'Copperleaf'),
  activity('2026-11-17', 'FOLLOW_UP', 'NETWORKING'),
  activity('2026-11-18', 'REJECTION'),
  // Last week, so it doesn't count.
  activity('2026-11-14', 'APPLICATION_SENT', 'APPLYING', 'Maple & Co'),
];
const goalDays = ['2026-11-16', '2026-11-17', '2026-11-10'];
const week = countWeek(activities, goalDays, '2026-11-16', '2026-11-22');

describe('countWeek', () => {
  it('counts only the week, and each company once', () => {
    expect(week).toMatchObject({ applications: 2, networking: 1, closures: 1, goalDays: 2 });
    expect(week.companies).toEqual(['Brightline', 'Copperleaf']);
  });
});

describe('recapStats', () => {
  it('shows only what you did, with a natural label for goal days', () => {
    expect(recapStats(week)).toEqual([
      { value: 2, label: 'applications' },
      { value: 2, label: 'days with goals complete' },
      { value: 1, label: 'networking' },
    ]);
    expect(recapStats({ ...week, goalDays: 1 })[1].label).toBe('day with goals complete');
  });
});

describe('recapText', () => {
  const base = { title: 'My job hunt this week', dateRange: 'Nov 16 – Nov 22', week };

  it('reads as a short list, without the old "perfect day" wording', () => {
    const text = recapText({ ...base, streak: 5, companies: [] });
    expect(text).toBe(
      [
        'My job hunt this week (Nov 16 – Nov 22):',
        '• 2 applications sent',
        '• 1 networking conversation',
        '• 1 door closed, which is progress too',
        '• Goals completed on 2 days',
        '• 5-day streak',
        '',
        'Onward!',
      ].join('\n'),
    );
    expect(text).not.toMatch(/perfect/i);
  });

  it('names companies only when you choose to share them', () => {
    expect(recapText({ ...base, streak: 0, companies: [] })).not.toContain('Brightline');
    expect(recapText({ ...base, streak: 0, companies: week.companies })).toContain('Applied to: Brightline, Copperleaf');
  });
});
