import { plural } from './activities';

// The weekly recap's numbers and its shareable text, kept apart from the page
// so the words people copy and share can be tested on their own. The image
// (recapImage.ts) draws the same stats.

export type RecapStat = { value: number; label: string };

type Activity = {
  occurredOn: string;
  kind: string;
  category: string;
  jobApplication?: { company: string } | null;
};

export type WeekCounts = {
  total: number;
  applications: number;
  networking: number;
  interviews: number;
  materials: number;
  leetcode: number;
  practice: number;
  offers: number;
  closures: number;
  /** Days this week when every daily goal was done. */
  goalDays: number;
  /** Companies applied to this week, each once. */
  companies: string[];
};

/** Counts what you did between `start` and `end`, both included. */
export function countWeek(
  activities: readonly Activity[],
  goalDays: readonly string[],
  start: string,
  end: string,
): WeekCounts {
  const inWeek = activities.filter((a) => a.occurredOn >= start && a.occurredOn <= end);
  const count = (test: (a: Activity) => boolean) => inWeek.filter(test).length;
  const companies = [
    ...new Set(
      inWeek.filter((a) => a.kind === 'APPLICATION_SENT' && a.jobApplication).map((a) => a.jobApplication!.company),
    ),
  ];
  return {
    total: inWeek.length,
    applications: count((a) => a.kind === 'APPLICATION_SENT'),
    networking: count((a) => a.category === 'NETWORKING'),
    interviews: count((a) => a.kind === 'INTERVIEW'),
    materials: count((a) => a.kind === 'TAILORED_MATERIALS'),
    leetcode: count((a) => a.kind === 'LEETCODE'),
    practice: count((a) => a.kind === 'INTERVIEW_PRACTICE' || a.kind === 'STUDY_SESSION'),
    offers: count((a) => a.kind === 'OFFER'),
    closures: count((a) => a.kind === 'REJECTION'),
    goalDays: goalDays.filter((day) => day >= start && day <= end).length,
    companies,
  };
}

/**
 * Up to four numbers to show. Only what you did, so a shared recap
 * celebrates the work instead of listing zeros.
 */
export function recapStats(week: WeekCounts): RecapStat[] {
  const stats: RecapStat[] = [
    { value: week.applications, label: week.applications === 1 ? 'application' : 'applications' },
    { value: week.networking, label: 'networking' },
    { value: week.interviews, label: week.interviews === 1 ? 'interview' : 'interviews' },
    { value: week.materials, label: 'tailored materials' },
    { value: week.leetcode, label: week.leetcode === 1 ? 'LeetCode day' : 'LeetCode days' },
    { value: week.practice, label: week.practice === 1 ? 'practice session' : 'practice sessions' },
  ];
  if (week.goalDays > 0) {
    stats.splice(1, 0, {
      value: week.goalDays,
      label: week.goalDays === 1 ? 'day with goals complete' : 'days with goals complete',
    });
  }
  if (week.offers > 0) stats.unshift({ value: week.offers, label: week.offers === 1 ? 'offer!' : 'offers!' });
  const nonZero = stats.filter((stat) => stat.value > 0);
  return (nonZero.length > 0 ? nonZero : stats).slice(0, 4);
}

/** The recap as plain text, ready to paste into a message. */
export function recapText({
  title,
  dateRange,
  week,
  streak,
  companies,
}: {
  title: string;
  dateRange: string;
  week: WeekCounts;
  /** Shown only when above zero. */
  streak: number;
  /** Shown only when you chose to include company names. */
  companies: readonly string[];
}) {
  const lines = [`${title} (${dateRange}):`];
  if (week.offers > 0) lines.push(`• ${plural(week.offers, 'offer')}!`);
  if (week.applications > 0) lines.push(`• ${plural(week.applications, 'application')} sent`);
  if (week.networking > 0) lines.push(`• ${plural(week.networking, 'networking conversation')}`);
  if (week.interviews > 0) lines.push(`• ${plural(week.interviews, 'interview')}`);
  if (week.leetcode > 0) lines.push(`• ${plural(week.leetcode, 'day')} of LeetCode practice`);
  if (week.practice > 0) lines.push(`• ${plural(week.practice, 'practice session')}`);
  if (week.materials > 0) {
    lines.push(`• ${plural(week.materials, 'resume or cover letter', 'resumes and cover letters')} tailored`);
  }
  if (week.closures > 0) lines.push(`• ${plural(week.closures, 'door')} closed, which is progress too`);
  if (week.goalDays > 0) lines.push(`• Goals completed on ${plural(week.goalDays, 'day')}`);
  if (streak > 0) lines.push(`• ${streak}-day streak`);
  if (companies.length > 0) lines.push(`Applied to: ${companies.join(', ')}`);
  lines.push('', 'Onward!');
  return lines.join('\n');
}
