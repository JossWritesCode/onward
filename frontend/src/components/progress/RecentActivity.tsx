import { useState } from 'react';
import { useMutation } from '@apollo/client';
import type { ProgressQuery } from '../../gql/graphql';
import { DeleteActivityMutation } from '../../graphql/operations';
import { activityLabel, activitySource, CATEGORY_LABELS, formatDay } from '../../lib/activities';
import { TrashIcon } from '../icons';
import { Card } from '../ui';

type Activity = ProgressQuery['progress']['activities'][number];

const SHOWN = 12;

/** Your latest activity, with a way to undo something logged by mistake. */
export default function RecentActivity({ activities, today }: { activities: readonly Activity[]; today: string }) {
  const [showAll, setShowAll] = useState(false);
  const [deleteActivity] = useMutation(DeleteActivityMutation, { refetchQueries: ['Progress', 'Streak', 'Today'] });
  const shown = showAll ? activities.slice(0, 100) : activities.slice(0, SHOWN);

  return (
    <Card className="p-5">
      <h2 className="mb-1 font-serif text-[26px]/8 font-medium">Recent activity</h2>
      <p className="mb-4 text-sm text-muted">Each step you took, newest first.</p>
      {activities.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing yet. Move a card on your board or log a win, and it'll show up here.
        </p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {shown.map((activity) => (
            <li key={activity.id} className="flex items-start gap-3 py-2.5">
              <span className="w-14 shrink-0 pt-0.5 text-xs font-semibold text-muted tabular-nums">
                {activity.occurredOn === today ? 'Today' : formatDay(activity.occurredOn)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {activityLabel(activity)}
                  {activity.jobApplication && (
                    <span className="font-normal break-words text-muted"> · {activity.jobApplication.company}</span>
                  )}
                  {activity.contact && (
                    <span className="font-normal text-muted"> · {activity.contact.name}</span>
                  )}
                </p>
                {activity.note && <p className="text-sm text-ink/85">{activity.note}</p>}
                <p className="text-xs text-muted">
                  {CATEGORY_LABELS[activity.category]}
                  {activity.automatic && ` · ${activitySource(activity.kind)}`}
                </p>
              </div>
              {!activity.automatic && (
                <button
                  type="button"
                  aria-label={`Delete "${activityLabel(activity)}" from ${formatDay(activity.occurredOn)}`}
                  onClick={() => {
                    if (window.confirm('Delete this from your history?')) void deleteActivity({ variables: { id: activity.id } });
                  }}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-700 dark:text-stone-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
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
          className="mt-2 text-sm font-semibold text-link hover:underline"
        >
          {showAll ? 'Show less' : 'Show more'}
        </button>
      )}
    </Card>
  );
}
