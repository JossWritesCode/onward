import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { addDays, formatDay, mondayOf, parseIso, plural } from '../lib/activities';

export type Scale = 'violet' | 'green' | 'amber';

const SCALES: Record<Scale, string[]> = {
  violet: [
    'bg-stone-200 dark:bg-stone-800',
    'bg-brand-200 dark:bg-brand-900',
    'bg-brand-300 dark:bg-brand-700',
    'bg-brand-500 dark:bg-brand-500',
    'bg-brand-700 dark:bg-brand-300',
  ],
  green: [
    'bg-stone-200 dark:bg-stone-800',
    'bg-emerald-200 dark:bg-emerald-900',
    'bg-emerald-400 dark:bg-emerald-700',
    'bg-emerald-600 dark:bg-emerald-500',
    'bg-emerald-800 dark:bg-emerald-300',
  ],
  amber: [
    'bg-stone-200 dark:bg-stone-800',
    'bg-gold-100 dark:bg-amber-900',
    'bg-gold-300 dark:bg-amber-700',
    'bg-gold-400 dark:bg-amber-500',
    'bg-gold-700 dark:bg-amber-300',
  ],
};

/** Splits counts into 5 shades. Thresholds adapt to how busy your busiest days are. */
function level(count: number, max: number) {
  if (count <= 0) return 0;
  if (max <= 4) return Math.min(count, 4);
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

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

/** A GitHub-style grid of days for any daily count, like LeetCode submissions or GitHub contributions. */
export default function CalendarHeatMap({
  days,
  today,
  scale,
  unit,
}: {
  days: readonly { date: string; count: number }[];
  today: string;
  scale: Scale;
  /** What's being counted, singular, like "contribution". */
  unit: string;
}) {
  const weeks = useWeeks();
  const scrollRef = useRef<HTMLDivElement>(null);
  const counts = useMemo(() => new Map(days.map((day) => [day.date, day.count])), [days]);

  const start = addDays(mondayOf(today), -(weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
  const visible = columns.flat().filter((date) => date <= today);
  const max = Math.max(0, ...visible.map((date) => counts.get(date) ?? 0));
  const total = visible.reduce((sum, date) => sum + (counts.get(date) ?? 0), 0);
  const shades = SCALES[scale];

  // On narrow screens, start scrolled to today.
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollLeft = box.scrollWidth;
  }, [weeks]);

  return (
    <div>
      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div
          className="inline-grid grid-flow-col gap-[3px]"
          style={{ gridTemplateRows: 'auto repeat(7, auto)', '--cell': weeks === 53 ? '12px' : '14px' } as CSSProperties}
          role="img"
          aria-label={`${plural(total, unit)} in the last ${weeks === 53 ? 'year' : '4 months'}`}
        >
          {columns.map((dates, week) => {
            const month = parseIso(dates[0]).getUTCMonth();
            const previousMonth = week > 0 ? parseIso(columns[week - 1][0]).getUTCMonth() : -1;
            return [
              <span key={`m${week}`} className="h-4 text-[10px] whitespace-nowrap text-stone-400">
                {month !== previousMonth ? formatDay(dates[0], { month: 'short' }) : ''}
              </span>,
              ...dates.map((date) => {
                if (date > today) return <span key={date} className="size-[var(--cell)]" />;
                const count = counts.get(date) ?? 0;
                return (
                  <span
                    key={date}
                    title={`${formatDay(date, { weekday: 'short', month: 'short', day: 'numeric' })}: ${plural(count, unit)}`}
                    className={`size-[var(--cell)] rounded-[3px] ${shades[level(count, max)]} ${
                      date === today ? 'outline-2 outline-offset-1 outline-stone-400' : ''
                    }`}
                  />
                );
              }),
            ];
          })}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
        <span>
          {plural(total, unit)} in the last {weeks === 53 ? 'year' : '4 months'}
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {shades.map((shade) => (
            <span key={shade} className={`size-3 rounded-[3px] ${shade}`} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
