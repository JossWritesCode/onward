import { formatDay } from '../lib/activities';
import { ReplyIcon } from './icons';

/**
 * "Follow up Nov 16" on board cards and list rows. A quiet grey outline while
 * it's coming up, filled violet on the day and for as long as it's overdue.
 */
export default function FollowUpTag({
  on,
  due,
  className = '',
}: {
  on: string | null | undefined;
  due: boolean;
  className?: string;
}) {
  if (!on) return null;

  const colors = due
    ? 'border-brand-100 bg-brand-50 font-semibold text-brand-700 dark:border-transparent dark:bg-brand-tint dark:text-brand-250'
    : 'border-stone-200 text-stone-500 dark:border-night-700 dark:text-night-300';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${colors} ${className}`}
      title={due ? 'Time to follow up' : undefined}
    >
      <ReplyIcon className="shrink-0" /> Follow up {formatDay(on)}
    </span>
  );
}
