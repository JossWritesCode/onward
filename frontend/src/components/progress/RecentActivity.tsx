import { useState } from 'react';
import { useMutation } from '@apollo/client';
import type { ProgressQuery } from '../../gql/graphql';
import { DeleteActivityMutation } from '../../graphql/operations';
import { ACTIVITY_LABELS, CATEGORY_LABELS, formatDay } from '../../lib/activities';
import { TrashIcon } from '../icons';
import { Card } from '../ui';

type Activity = ProgressQuery['progress']['activities'][number];

const SHOWN = 12;

/** Your latest activity, with a way to undo something logged by mistake. */
export default function RecentActivity({ activities, today }: { activities: readonly Activity[]; today: string }) {
  const [showAll, setShowAll] = useState(false);
  const [deleteActivity] = useMutation(DeleteActivityMutation, { refetchQueries: ['Progress', 'Streak'] });
  const shown = showAll ? activities.slice(0, 100) : activities.slice(0, SHOWN);

  return (
    <Card className="p-5">
      <h2 className="mb-3 text-xl font-black">Recent activity</h2>
      {activities.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Nothing yet. Move a card on your board or log a win, and it'll show up here.
        </p>
      ) : (
        <ul className="divide-y-2 divide-stone-100 dark:divide-stone-800">
          {shown.map((activity) => (
            <li key={activity.id} className="flex items-start gap-3 py-2.5">
              <span className="w-14 shrink-0 pt-0.5 text-xs font-bold text-stone-400">
                {activity.occurredOn === today ? 'Today' : formatDay(activity.occurredOn)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {ACTIVITY_LABELS[activity.kind]}
                  {activity.jobApplication && (
                    <span className="font-normal text-stone-500 dark:text-stone-400"> · {activity.jobApplication.company}</span>
                  )}
                  {activity.contact && (
                    <span className="font-normal text-stone-500 dark:text-stone-400"> · {activity.contact.name}</span>
                  )}
                </p>
                {activity.note && <p className="text-sm text-stone-600 dark:text-stone-300">{activity.note}</p>}
                <p className="text-xs text-stone-400">
                  {CATEGORY_LABELS[activity.category]}
                  {activity.automatic && ' · from your board'}
                </p>
              </div>
              {!activity.automatic && (
                <button
                  type="button"
                  aria-label={`Delete "${ACTIVITY_LABELS[activity.kind]}" from ${formatDay(activity.occurredOn)}`}
                  onClick={() => {
                    if (window.confirm('Delete this from your history?')) void deleteActivity({ variables: { id: activity.id } });
                  }}
                  className="rounded-lg p-1.5 text-stone-300 hover:bg-rose-50 hover:text-rose-600 dark:text-stone-600 dark:hover:bg-rose-950/40"
                >
                  <TrashIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {activities.length > SHOWN && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
        >
          {showAll ? 'Show less' : 'Show more'}
        </button>
      )}
    </Card>
  );
}
