import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { ProgressQuery } from '../../gql/graphql';
import { ACTIVITY_LABELS, addDays, formatDay, mondayOf, parseIso, plural } from '../../lib/activities';
import { SnowflakeIcon } from '../icons';

type Activity = ProgressQuery['progress']['activities'][number];

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

function intensity(count: number) {
  if (count === 0) return 'bg-stone-200 dark:bg-stone-800';
  if (count === 1) return 'bg-brand-200 dark:bg-brand-900';
  if (count === 2) return 'bg-brand-300 dark:bg-brand-700';
  if (count <= 4) return 'bg-brand-500 dark:bg-brand-500';
  return 'bg-brand-700 dark:bg-brand-300';
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
}: {
  activities: readonly Activity[];
  today: string;
  frozenDates: readonly string[];
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
            <span key={index} aria-hidden="true" className="pr-1 text-[10px] leading-[var(--cell)] text-stone-400">
              {label}
            </span>
          ))}

          {columns.map((days, week) => {
            const firstDay = parseIso(days[0]);
            const previousMonth = week > 0 ? parseIso(columns[week - 1][0]).getUTCMonth() : -1;
            const monthLabel = firstDay.getUTCMonth() !== previousMonth ? formatDay(days[0], { month: 'short' }) : '';

            return [
              <span key={`m${week}`} aria-hidden="true" className="h-4 text-[10px] whitespace-nowrap text-stone-400">
                {monthLabel}
              </span>,
              ...days.map((date) => {
                if (date > today) return <span key={date} className="size-[var(--cell)]" />;
                const count = byDay.get(date)?.length ?? 0;
                const isFrozen = count === 0 && frozen.has(date);
                const description = isFrozen
                  ? `${formatDay(date, { weekday: 'long', month: 'long', day: 'numeric' })}: covered by a streak freeze`
                  : `${formatDay(date, { weekday: 'long', month: 'long', day: 'numeric' })}: ${plural(count, 'thing')}`;
                return (
                  <button
                    key={date}
                    type="button"
                    aria-label={description}
                    aria-pressed={selected === date}
                    title={description}
                    onClick={() => setSelected(date)}
                    onMouseEnter={() => setSelected(date)}
                    className={`size-[var(--cell)] rounded-[3px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      isFrozen ? 'bg-sky-300 dark:bg-sky-700' : intensity(count)
                    } ${selected === date ? 'ring-2 ring-stone-800 ring-offset-1 dark:ring-stone-100 dark:ring-offset-stone-900' : ''} ${
                      date === today ? 'outline-2 outline-offset-1 outline-gold-400' : ''
                    }`}
                  />
                );
              }),
            ];
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
        <span>
          Active on {plural(activeDays, 'day')} in the last {weeks === 53 ? 'year' : '4 months'}
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {[0, 1, 2, 3, 5].map((count) => (
            <span key={count} className={`size-3 rounded-[3px] ${intensity(count)}`} />
          ))}
          More
          <span className="ml-2 size-3 rounded-[3px] bg-sky-300 dark:bg-sky-700" />
          Freeze
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-stone-100 px-4 py-3 dark:bg-stone-800/60" aria-live="polite">
        <p className="font-extrabold">
          {selected === today ? 'Today' : formatDay(selected, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {selectedActivities.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
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
          <ul className="mt-1 space-y-0.5 text-sm text-stone-600 dark:text-stone-300">
            {selectedActivities.map((activity) => (
              <li key={activity.id}>
                {ACTIVITY_LABELS[activity.kind]}
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
