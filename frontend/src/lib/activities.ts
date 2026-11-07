import type { ActivityCategory, ActivityKind } from '../gql/graphql';

/** What each activity reads as in lists and the heat map's day details. */
export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  APPLICATION_SENT: 'Sent an application',
  INTERVIEW: 'Landed an interview',
  OFFER: 'Got an offer',
  REJECTION: 'Heard back (closure)',
  NETWORKING_MESSAGE: 'Sent a networking message',
  COFFEE_CHAT: 'Had a coffee chat',
  FOLLOW_UP: 'Followed up',
  TAILORED_MATERIALS: 'Tailored a resume or cover letter',
  INTERVIEW_PRACTICE: 'Practiced an interview answer',
  INTERVIEW_PREPPED: 'Finished prepping for an interview',
  STUDY_SESSION: 'Study session',
  LEETCODE: 'Practiced on LeetCode',
  CUSTOM: 'Custom action',
};

/** An activity's label, using the action's own name for custom actions. */
export function activityLabel(activity: { kind: ActivityKind; customAction?: { name: string } | null }): string {
  if (activity.kind === 'CUSTOM' && activity.customAction) return activity.customAction.name;
  return ACTIVITY_LABELS[activity.kind];
}

/** Where an automatically recorded activity came from, for the activity list. */
export function activitySource(kind: ActivityKind): string {
  if (BOARD_KINDS.includes(kind)) return 'from your board';
  if (kind === 'LEETCODE') return 'from LeetCode';
  return 'from Prep';
}

/** Recorded when you move a card on the board. */
export const BOARD_KINDS: readonly ActivityKind[] = ['APPLICATION_SENT', 'INTERVIEW', 'OFFER', 'REJECTION'];

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  APPLYING: 'Applying',
  NETWORKING: 'Networking',
  INTERVIEW_PREP: 'Interview prep',
  MATERIALS: 'Materials',
};

/** The wins you log yourself on the Progress page. The rest come from the board. */
export const LOGGABLE: readonly { kind: ActivityKind; title: string; hint: string }[] = [
  { kind: 'NETWORKING_MESSAGE', title: 'Networking message', hint: 'Reached out to someone' },
  { kind: 'COFFEE_CHAT', title: 'Coffee chat', hint: 'Or an informational interview' },
  { kind: 'FOLLOW_UP', title: 'Follow-up', hint: 'Checked in on an application' },
  { kind: 'TAILORED_MATERIALS', title: 'Tailored materials', hint: 'Resume or cover letter' },
];

// Dates arrive as "YYYY-MM-DD" in your time zone. Doing the math in UTC keeps
// daylight saving changes from shifting days around.

export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** The Monday on or before a date. Weeks run Monday to Sunday. */
export function mondayOf(iso: string): string {
  const daysSinceMonday = (parseIso(iso).getUTCDay() + 6) % 7;
  return addDays(iso, -daysSinceMonday);
}

export function formatDay(iso: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return parseIso(iso).toLocaleDateString(undefined, { ...options, timeZone: 'UTC' });
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Days in a row that are worth a celebration. */
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 150, 200, 250, 300, 365, 500, 730, 1000];
