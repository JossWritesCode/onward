// What to say when moving a card back takes back what a mistaken move recorded.
// The server decides what's taken back (see "Taking back a mistaken move" in
// backend/app/models/job_application.rb) and answers with the kinds.

const NAMES: Record<string, string> = {
  APPLICATION_SENT: 'an application',
  INTERVIEW: 'an interview',
  OFFER: 'an offer',
  REJECTION: 'a closure',
};

/** The note for a move that took these kinds of activity back, or null when it took nothing back. */
export function undoneMessage(kinds: readonly string[] | null | undefined): { title: string; body: string } | null {
  // In the order they happen in a job hunt, whatever order they arrive in.
  const names = Object.keys(NAMES)
    .filter((kind) => kinds?.includes(kind))
    .map((kind) => NAMES[kind]);
  if (names.length === 0) return null;

  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
  return { title: 'Moved back', body: `That won't count as ${list}.` };
}
