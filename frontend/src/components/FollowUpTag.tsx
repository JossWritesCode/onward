import { formatDay } from '../lib/activities';
import { ReplyIcon } from './icons';

/**
 * "Follow up Nov 16" on board cards and list rows. A quiet grey outline while
 * it's coming up, and the warm accent on the day and for as long as it's overdue.
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
    ? 'border-transparent bg-accent-tint font-semibold text-accent'
    : 'border-line text-muted';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${colors} ${className}`}
      title={due ? 'Time to follow up' : undefined}
    >
      <ReplyIcon className="shrink-0" /> Follow up {formatDay(on)}
    </span>
  );
}
