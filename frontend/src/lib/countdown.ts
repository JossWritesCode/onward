/** "Today at 2:00 PM", "Tomorrow at 10:30 AM", "In 3 days", or "2 days ago". */
export function describeInterviewTime(iso: string, now = new Date()): string {
  const when = new Date(iso);
  const time = when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(when) - startOfDay(now)) / 86_400_000);

  if (days === 0) return when < now ? `Earlier today at ${time}` : `Today at ${time}`;
  if (days === 1) return `Tomorrow at ${time}`;
  if (days === -1) return 'Yesterday';
  if (days > 1) return `In ${days} days`;
  return `${-days} days ago`;
}

/** Short version for board cards: "Interview today", "Interview in 3 days". */
export function shortInterviewTime(iso: string, now = new Date()): string {
  const description = describeInterviewTime(iso, now);
  if (description.startsWith('Today')) return 'Interview today';
  if (description.startsWith('Tomorrow')) return 'Interview tomorrow';
  return `Interview ${description.toLowerCase()}`;
}

/** The value a datetime-local input needs, in the browser's time zone. */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
