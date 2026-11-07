import type { DailyGoalKind } from '../gql/graphql';
import { plural } from './activities';
import { formatMinutes } from './format';

type GoalLike = { kind: DailyGoalKind; target: number; customAction?: { name: string } | null };

/** The built-in kinds of goal, in the order the "Add a goal" menu lists them. */
export const GOAL_KINDS: readonly {
  kind: Exclude<DailyGoalKind, 'CUSTOM'>;
  title: string;
  hint: string;
  defaultTarget: number;
  engineering?: boolean;
}[] = [
  { kind: 'APPLICATIONS', title: 'Apply to jobs', hint: 'Cards moved into an applied column', defaultTarget: 1 },
  { kind: 'NETWORKING', title: 'Reach out', hint: 'Networking messages, coffee chats, and follow-ups', defaultTarget: 1 },
  { kind: 'PRACTICE', title: 'Practice interview questions', hint: 'Reps in practice mode on the Prep page', defaultTarget: 2 },
  { kind: 'STUDY', title: 'Study', hint: 'Minutes from the study timer, or time you add', defaultTarget: 25 },
  { kind: 'MATERIALS', title: 'Tailor resumes or cover letters', hint: 'Logged from "Log a win"', defaultTarget: 1 },
  { kind: 'LEETCODE', title: 'Solve LeetCode problems', hint: 'Different problems accepted today', defaultTarget: 1, engineering: true },
  { kind: 'GITHUB', title: 'Contribute on GitHub', hint: 'Commits, pull requests, issues, and reviews', defaultTarget: 1, engineering: true },
];

/** "Apply to 1 job", "Study for 25 min", "Went to a meetup (2×)". */
export function goalLabel({ kind, target, customAction }: GoalLike): string {
  switch (kind) {
    case 'APPLICATIONS':
      return `Apply to ${plural(target, 'job')}`;
    case 'NETWORKING':
      return target === 1 ? 'Reach out to someone' : `Reach out ${target} times`;
    case 'PRACTICE':
      return `Practice ${plural(target, 'interview question')}`;
    case 'STUDY':
      return `Study for ${formatMinutes(target)}`;
    case 'MATERIALS':
      return `Tailor ${plural(target, 'resume or cover letter', 'resumes or cover letters')}`;
    case 'LEETCODE':
      return `Solve ${plural(target, 'LeetCode problem')}`;
    case 'GITHUB':
      return `Make ${plural(target, 'GitHub contribution')}`;
    case 'CUSTOM':
      return target === 1 ? (customAction?.name ?? 'Custom action') : `${customAction?.name ?? 'Custom action'} (${target}×)`;
  }
}

/** "0/1", or "10/25 min" for study goals. */
export function goalProgress(kind: DailyGoalKind, count: number, target: number): string {
  const shown = Math.min(count, target);
  return kind === 'STUDY' ? `${shown}/${target} min` : `${shown}/${target}`;
}

/** Where to go to work on a goal. External links open in a new tab. */
export function goalLink(kind: DailyGoalKind): { to: string; external?: boolean } {
  switch (kind) {
    case 'APPLICATIONS':
      return { to: '/applications/new' };
    case 'PRACTICE':
    case 'STUDY':
      return { to: '/prep' };
    case 'LEETCODE':
      return { to: 'https://leetcode.com/problemset/', external: true };
    case 'GITHUB':
      return { to: 'https://github.com', external: true };
    default:
      return { to: '/progress' };
  }
}

/** Goals that read from LeetCode or GitHub, which refresh every 30 minutes. */
export function isSyncedGoal(kind: DailyGoalKind) {
  return kind === 'LEETCODE' || kind === 'GITHUB';
}
