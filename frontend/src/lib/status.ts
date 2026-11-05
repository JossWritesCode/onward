import type { JobApplicationStatus, WorkArrangement } from '../gql/graphql';

export const STATUSES: readonly JobApplicationStatus[] = ['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'];

export const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
};

export const STATUS_STYLES: Record<JobApplicationStatus, string> = {
  SAVED: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  APPLIED: 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200',
  INTERVIEWING: 'bg-gold-100 text-gold-700 dark:bg-amber-900/40 dark:text-amber-200',
  OFFER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
};

export const WORK_ARRANGEMENTS: readonly WorkArrangement[] = ['ONSITE', 'HYBRID', 'REMOTE'];

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
};
