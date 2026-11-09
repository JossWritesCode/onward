import { formatDay } from '../lib/activities';
import { ReplyIcon } from './icons';

/**
 * "Follow up Nov 16" on board cards and list rows. Grey while it's coming up,
 * violet on the day and for as long as it's overdue.
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
    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200'
    : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold whitespace-nowrap ${colors} ${className}`}
      title={due ? 'Time to follow up' : undefined}
    >
      <ReplyIcon className="shrink-0" /> Follow up {formatDay(on)}
    </span>
  );
}
