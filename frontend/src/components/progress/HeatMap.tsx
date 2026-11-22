import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { ProgressQuery } from '../../gql/graphql';
import { activityLabel, addDays, formatDay, mondayOf, parseIso, plural } from '../../lib/activities';
import { CheckIcon, SnowflakeIcon } from '../icons';

type Activity = ProgressQuery['progress']['activities'][number];

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

function intensity(count: number) {
  if (count === 0) return 'bg-stone-200 dark:bg-stone-800';
  // Sage steps that stay clearly apart from empty days in both themes.
  if (count === 1) return 'bg-brand-300 dark:bg-brand-600';
  if (count === 2) return 'bg-brand-400 dark:bg-brand-500';
  if (count <= 4) return 'bg-brand-600 dark:bg-brand-400';
  return 'bg-brand-900 dark:bg-brand-200';
}

/** How many weeks fit: a year on computers, about four months on phones. */
function useWeeks() {
  const query = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return wide ? 53 : 16;
}

/** A GitHub-style grid: one square per day, darker on busier days. */
export default function HeatMap({
  activities,
  today,
  frozenDates,
  goalDates,
}: {
  activities: readonly Activity[];
  today: string;
  frozenDates: readonly string[];
  /** Days every goal was done. They show in gold. */
  goalDates: readonly string[];
}) {
  const weeks = useWeeks();
  const [selected, setSelected] = useState(today);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If the grid is wider than the screen, start scrolled to today.
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollLeft = box.scrollWidth;
  }, [weeks]);

  const byDay = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const activity of activities) {
      const list = map.get(activity.occurredOn) ?? [];
      list.push(activity);
      map.set(activity.occurredOn, list);
    }
    return map;
  }, [activities]);
  const frozen = useMemo(() => new Set(frozenDates), [frozenDates]);
  const goalsDone = useMemo(() => new Set(goalDates), [goalDates]);

  const start = addDays(mondayOf(today), -(weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
  const activeDays = columns.flat().filter((date) => date <= today && byDay.has(date)).length;

  const selectedActivities = byDay.get(selected) ?? [];

  return (
    <div>
      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div
          className="inline-grid grid-flow-col gap-[3px]"
          style={{ gridTemplateRows: 'auto repeat(7, auto)', '--cell': weeks === 53 ? '12px' : '14px' } as CSSProperties}
        >
          {/* Day labels */}
          <span aria-hidden="true" />
          {DAY_LABELS.map((label, index) => (
            <span key={index} aria-hidden="true" className="pr-1 text-[10px] leading-[var(--cell)] text-muted">
              {label}
            </span>
          ))}

          {columns.map((days, week) => {
            const firstDay = parseIso(days[0]);
            const previousMonth = week > 0 ? parseIso(columns[week - 1][0]).getUTCMonth() : -1;
            const monthLabel = firstDay.getUTCMonth() !== previousMonth ? formatDay(days[0], { month: 'short' }) : '';

            return [
              <span key={`m${week}`} aria-hidden="true" className="h-4 text-[10px] whitespace-nowrap text-muted">
                {monthLabel}
              </span>,
              ...days.map((date) => {
                if (date > today) return <span key={date} className="size-[var(--cell)]" />;
                const count = byDay.get(date)?.length ?? 0;
                const isFrozen = count === 0 && frozen.has(date);
                const isGoalDay = goalsDone.has(date);
                const day = formatDay(date, { weekday: 'long', month: 'long', day: 'numeric' });
                const description = isFrozen
                  ? `${day}: covered by a streak freeze`
                  : `${day}: ${plural(count, 'thing')}${isGoalDay ? ', goals completed' : ''}`;
                return (
                  <button
                    key={date}
                    type="button"
                    aria-label={description}
                    aria-pressed={selected === date}
                    title={description}
                    onClick={() => setSelected(date)}
                    onMouseEnter={() => setSelected(date)}
                    className={`size-[var(--cell)] rounded-[3px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                      isGoalDay ? 'bg-gold-400' : isFrozen ? 'bg-sky-300 dark:bg-sky-700' : intensity(count)
                    } ${selected === date ? 'ring-2 ring-ink ring-offset-1 ring-offset-surface' : ''} ${
                      date === today ? 'outline-2 outline-offset-1 outline-gold-400' : ''
                    }`}
                  />
                );
              }),
            ];
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>
          Active on {plural(activeDays, 'day')} in the last {weeks === 53 ? 'year' : '4 months'}
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {[0, 1, 2, 3, 5].map((count) => (
            <span key={count} className={`size-3 rounded-[3px] ${intensity(count)}`} />
          ))}
          More
          <span className="ml-2 size-3 rounded-[3px] bg-gold-400" />
          Goals completed
          <span className="ml-2 size-3 rounded-[3px] bg-sky-300 dark:bg-sky-700" />
          Freeze
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-stone-100 px-4 py-3 dark:bg-night-900" aria-live="polite">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {selected === today ? 'Today' : formatDay(selected, { weekday: 'long', month: 'long', day: 'numeric' })}
          {goalsDone.has(selected) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-xs text-gold-700 dark:bg-gold-night dark:text-gold-200">
              <CheckIcon /> Goals completed
            </span>
          )}
        </p>
        {selectedActivities.length === 0 ? (
          <p className="text-sm text-muted">
            {frozen.has(selected) ? (
              <span className="inline-flex items-center gap-1">
                <SnowflakeIcon /> A streak freeze covered this day.
              </span>
            ) : selected === today ? (
              'Nothing yet. One small step keeps your streak going.'
            ) : (
              'A rest day.'
            )}
          </p>
        ) : (
          <ul className="mt-1 space-y-0.5 text-sm text-muted">
            {selectedActivities.map((activity) => (
              <li key={activity.id}>
                {activityLabel(activity)}
                {activity.jobApplication && ` · ${activity.jobApplication.company}`}
                {activity.contact && ` · ${activity.contact.name}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
