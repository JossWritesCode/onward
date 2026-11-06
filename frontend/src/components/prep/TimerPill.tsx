import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { formatClock, stopTimer, useStudyTimer } from '../../lib/studyTimer';
import { TimerIcon } from '../icons';
import { useFinishStudySession } from './StudyTimer';

/**
 * Shows a running study timer in the header on every page, and saves the
 * session when time is up, wherever you are in the app.
 */
export default function TimerPill() {
  const { running, remainingMs } = useStudyTimer();
  const finish = useFinishStudySession();
  const finishing = useRef(false);

  useEffect(() => {
    if (!running || remainingMs > 0 || finishing.current) return;
    finishing.current = true;
    const session = stopTimer();
    void (session ? finish(session, false) : Promise.resolve()).finally(() => {
      finishing.current = false;
    });
  }, [running, remainingMs, finish]);

  if (!running) return null;

  return (
    <NavLink
      to="/prep"
      aria-label={`Study timer: ${formatClock(remainingMs)} left on ${running.topic}`}
      className="inline-flex items-center gap-1 rounded-xl bg-brand-100 px-2 py-1.5 text-sm font-black text-brand-700 tabular-nums hover:bg-brand-200 dark:bg-brand-900/60 dark:text-brand-200"
    >
      <TimerIcon className="text-lg" />
      {formatClock(remainingMs)}
    </NavLink>
  );
}
