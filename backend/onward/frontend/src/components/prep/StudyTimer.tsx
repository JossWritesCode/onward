import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LogStudySessionMutation } from '../../graphql/operations';
import { celebrateStudy, showToast } from '../../lib/celebrate';
import { formatClock, startTimer, stopTimer, useStudyTimer } from '../../lib/studyTimer';
import { TimerIcon } from '../icons';
import { Button, Card, Field, Input } from '../ui';

const PRESETS = [15, 25, 45];

/** Saves a finished (or stopped) session. Used by the timer card and the background watcher. */
export function useFinishStudySession() {
  const [logStudySession] = useMutation(LogStudySessionMutation, { refetchQueries: ['Streak', 'Progress', 'Prep'] });

  return async function finish(session: { topic: string; minutes: number }, stoppedEarly: boolean) {
    try {
      const { data } = await logStudySession({ variables: session });
      if (data?.logStudySession.counted) {
        celebrateStudy(session.minutes, session.topic);
      } else if (stoppedEarly) {
        showToast(
          'gentle',
          'Session stopped',
          "Under 10 minutes doesn't count toward your streak, but every bit of focus still helps.",
        );
      }
    } catch {
      showToast('gentle', "That session didn't save", 'Check that the Onward server is running.');
    }
  };
}

/** Focused study sessions with presets, a custom length, and your own topics. */
export default function StudyTimer({ topics }: { topics: readonly string[] }) {
  const { running, remainingMs, elapsedMs } = useStudyTimer();
  const finish = useFinishStudySession();
  const [topic, setTopic] = useState(topics[0] ?? '');
  const [minutes, setMinutes] = useState(25);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  function start() {
    const length = custom ? Number(custom) : minutes;
    if (!Number.isInteger(length) || length < 1 || length > 240) {
      setError('Pick a length between 1 and 240 minutes.');
      return;
    }
    setError(null);
    startTimer(topic, length);
  }

  async function stop() {
    const session = stopTimer();
    if (session) await finish(session, true);
  }

  if (running) {
    const percent = Math.min(100, (elapsedMs / (running.minutes * 60_000)) * 100);
    return (
      <Card className="p-5">
        <p className="text-sm font-extrabold text-brand-600 dark:text-brand-300">Studying {running.topic}</p>
        <p className="my-2 text-5xl font-black tabular-nums" aria-live="off">
          {formatClock(remainingMs)}
        </p>
        <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
          The timer keeps running if you leave this page. You'll hear a chime when it's done.
        </p>
        <Button variant="secondary" onClick={stop}>
          Stop early
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <TimerIcon className="text-2xl text-brand-500" />
        <h2 className="text-xl font-black">Study timer</h2>
      </div>

      <div className="space-y-4">
        <Field label="What are you studying?" htmlFor="study-topic">
          <Input
            id="study-topic"
            list="study-topics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="LeetCode, system design, a certification…"
            maxLength={60}
          />
          <datalist id="study-topics">
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-bold text-stone-700 dark:text-stone-300">How long?</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={!custom && minutes === preset}
                onClick={() => {
                  setMinutes(preset);
                  setCustom('');
                }}
                className={`rounded-xl border-2 px-3.5 py-1.5 font-extrabold transition ${
                  !custom && minutes === preset
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-stone-200 hover:border-brand-300 dark:border-stone-700'
                }`}
              >
                {preset} min
              </button>
            ))}
            <label className="sr-only" htmlFor="study-custom">
              Custom length in minutes
            </label>
            <Input
              id="study-custom"
              type="number"
              min={1}
              max={240}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Custom"
              className="w-28 py-1.5"
            />
          </div>
          {error && <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Sessions of 10 minutes or more count toward your streak, even if you stop early.
          </p>
        </div>

        <Button onClick={start}>
          <TimerIcon /> Start
        </Button>
      </div>
    </Card>
  );
}
