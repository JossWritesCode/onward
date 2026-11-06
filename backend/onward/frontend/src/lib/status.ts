import type { JobApplicationStatus, WorkArrangement } from '../gql/graphql';

// A board column's "kind" uses the same five values as an application's status.
export type StageKind = JobApplicationStatus;

export const STATUSES: readonly JobApplicationStatus[] = ['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'];

export const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
};

export const KIND_HELP: Record<StageKind, string> = {
  SAVED: "Jobs you're thinking about applying to",
  APPLIED: "Applications you've sent",
  INTERVIEWING: 'Any interview round, from phone screens to final rounds',
  OFFER: "Offers you've received",
  REJECTED: 'Closed for now',
};

export const STATUS_STYLES: Record<JobApplicationStatus, string> = {
  SAVED: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  APPLIED: 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200',
  INTERVIEWING: 'bg-gold-100 text-gold-700 dark:bg-amber-900/40 dark:text-amber-200',
  OFFER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
};

/** A solid dot or strip for each kind, used on board column headers. */
export const KIND_ACCENTS: Record<StageKind, string> = {
  SAVED: 'bg-stone-400',
  APPLIED: 'bg-brand-500',
  INTERVIEWING: 'bg-gold-400',
  OFFER: 'bg-emerald-500',
  REJECTED: 'bg-rose-400',
};

export const WORK_ARRANGEMENTS: readonly WorkArrangement[] = ['ONSITE', 'HYBRID', 'REMOTE'];

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
};
