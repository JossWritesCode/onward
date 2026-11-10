const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2024-01" becomes "Jan '24". "Present", a bare year, and anything else are shown as written. */
export function formatResumeDate(date: string): string {
  const value = date.trim();
  const match = /^(\d{4})-(\d{1,2})$/.exec(value);
  if (!match) return value;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} '${match[1].slice(2)}` : value;
}

/** "Jan '24 - Present". Just the one date if the other is blank. */
export function formatResumeDateRange(start: string, end: string): string {
  return [formatResumeDate(start), formatResumeDate(end)].filter(Boolean).join(' - ');
}
