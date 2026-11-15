import { describe, expect, it } from 'vitest';
import { GOAL_KINDS, goalLabel, goalLink, goalProgress, isSyncedGoal } from './goals';

describe('goalLabel', () => {
  it.each([
    [{ kind: 'APPLICATIONS', target: 1 }, 'Apply to 1 job'],
    [{ kind: 'APPLICATIONS', target: 3 }, 'Apply to 3 jobs'],
    [{ kind: 'NETWORKING', target: 1 }, 'Reach out to someone'],
    [{ kind: 'NETWORKING', target: 2 }, 'Reach out 2 times'],
    [{ kind: 'PRACTICE', target: 2 }, 'Practice 2 interview questions'],
    [{ kind: 'STUDY', target: 25 }, 'Study for 25 min'],
    [{ kind: 'STUDY', target: 90 }, 'Study for 1 h 30 min'],
    [{ kind: 'MATERIALS', target: 1 }, 'Tailor 1 resume or cover letter'],
    [{ kind: 'MATERIALS', target: 2 }, 'Tailor 2 resumes or cover letters'],
    [{ kind: 'LEETCODE', target: 1 }, 'Solve 1 LeetCode problem'],
    [{ kind: 'GITHUB', target: 3 }, 'Make 3 GitHub contributions'],
  ] as const)('%o reads "%s"', (goal, label) => {
    expect(goalLabel(goal)).toBe(label);
  });

  it("uses a custom action's name, with a count when it's more than once", () => {
    const customAction = { name: 'Went to a meetup' };
    expect(goalLabel({ kind: 'CUSTOM', target: 1, customAction })).toBe('Went to a meetup');
    expect(goalLabel({ kind: 'CUSTOM', target: 2, customAction })).toBe('Went to a meetup (2×)');
    expect(goalLabel({ kind: 'CUSTOM', target: 1, customAction: null })).toBe('Custom action');
  });
});

describe('goalProgress', () => {
  it('shows the count against the target', () => {
    expect(goalProgress('APPLICATIONS', 0, 1)).toBe('0/1');
    expect(goalProgress('STUDY', 10, 25)).toBe('10/25 min');
  });

  it('never shows more than the target', () => {
    expect(goalProgress('APPLICATIONS', 4, 2)).toBe('2/2');
    expect(goalProgress('STUDY', 50, 25)).toBe('25/25 min');
  });
});

describe('goalLink', () => {
  it('sends you somewhere you can work on the goal', () => {
    expect(goalLink('APPLICATIONS')).toEqual({ to: '/applications/new' });
    expect(goalLink('STUDY')).toEqual({ to: '/prep' });
    expect(goalLink('NETWORKING')).toEqual({ to: '/progress' });
    expect(goalLink('LEETCODE')).toMatchObject({ external: true });
  });
});

it('only the engineering goals are synced from outside, and only they are marked engineering', () => {
  for (const goal of GOAL_KINDS) {
    expect(isSyncedGoal(goal.kind)).toBe(Boolean(goal.engineering));
  }
});
