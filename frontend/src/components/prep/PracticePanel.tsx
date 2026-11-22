import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router';
import type { PrepQuery } from '../../gql/graphql';
import { LogPracticeMutation } from '../../graphql/operations';
import { celebratePractice } from '../../lib/celebrate';
import { formatClock } from '../../lib/studyTimer';
import { MicIcon, ShuffleIcon } from '../icons';
import { Button, Card, Select } from '../ui';

type Question = PrepQuery['questions'][number];
type Story = PrepQuery['stories'][number];

const ANSWER_SECONDS = 120;

function randomQuestion(questions: readonly Question[], avoidId?: string) {
  const pool = questions.length > 1 ? questions.filter((q) => q.id !== avoidId) : questions;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

/** Flashcard-style practice: a question, a story to answer with, and a 2-minute timer. */
export default function PracticePanel({ questions, stories }: { questions: readonly Question[]; stories: readonly Story[] }) {
  const [question, setQuestion] = useState<Question | null>(() => randomQuestion(questions));
  const [storyId, setStoryId] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [logPractice, { loading }] = useMutation(LogPracticeMutation, { refetchQueries: ['Streak', 'Progress'] });

  const story = stories.find((s) => s.id === storyId);
  const elapsedSeconds = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const remainingMs = Math.max(0, (ANSWER_SECONDS - elapsedSeconds) * 1000);
  const overtime = startedAt !== null && elapsedSeconds > ANSWER_SECONDS;

  useEffect(() => {
    if (startedAt === null) return;
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  // If questions arrive after the first render, pick one.
  useEffect(() => {
    if (!question && questions.length > 0) setQuestion(randomQuestion(questions));
  }, [question, questions]);

  function nextQuestion() {
    setQuestion(randomQuestion(questions, question?.id));
    setStoryId('');
    setStartedAt(null);
  }

  async function rate(rating: 'NAILED_IT' | 'NEEDS_WORK') {
    await logPractice({
      variables: {
        questionId: question?.id ?? null,
        storyId: storyId || null,
        rating,
        seconds: startedAt ? Math.min(elapsedSeconds, 3600) : null,
      },
    });
    celebratePractice(rating);
    nextQuestion();
  }

  if (!question) {
    return (
      <Card className="p-5">
        <p className="text-muted">
          Your question bank is empty.{' '}
          <Link to="/prep/customize" className="font-semibold text-link hover:underline">
            Add some questions
          </Link>{' '}
          to start practicing.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/*
        Like a prompt in a workbook: a small plum label, then the question in
        the notebook's serif, set off by a thin plum rule.
      */}
      <div className="border-b border-line px-6 pt-7 pb-8">
        <p className="text-[13px]/[18px] font-semibold tracking-wide text-plum-accent uppercase">Practice prompt</p>
        <p className="mt-3 border-l-2 border-plum-accent/70 pl-4 font-serif text-[24px]/8 font-medium text-pretty text-ink sm:text-[28px]/9">
          {question.prompt}
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <label htmlFor="practice-story" className="mb-1.5 block text-sm/5 font-semibold">
            Which story would you tell?
          </label>
          <Select id="practice-story" value={storyId} onChange={(e) => setStoryId(e.target.value)}>
            <option value="">{stories.length === 0 ? 'No stories yet, answer off the top of your head' : 'Pick a story (optional)'}</option>
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </div>

        {story && (story.situation || story.task || story.action || story.result) && (
          <details className="rounded-lg border border-line px-4 py-3 text-sm">
            <summary className="cursor-pointer font-semibold">Peek at your notes</summary>
            <dl className="mt-2 space-y-1.5">
              {(
                [
                  ['Situation', story.situation],
                  ['Task', story.task],
                  ['Action', story.action],
                  ['Result', story.result],
                ] as const
              )
                .filter(([, text]) => text)
                .map(([label, text]) => (
                  <div key={label}>
                    <dt className="font-semibold text-link">{label}</dt>
                    <dd className="whitespace-pre-line text-muted">{text}</dd>
                  </div>
                ))}
            </dl>
          </details>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {startedAt === null ? (
            <Button
              variant="secondary"
              onClick={() => {
                setStartedAt(Date.now());
                setNow(Date.now());
              }}
            >
              <MicIcon /> Start answering
            </Button>
          ) : (
            <span
              className={`min-w-16 text-xl/7 font-medium tabular-nums ${overtime ? 'text-achieve' : 'text-ink'}`}
              aria-live="off"
            >
              {overtime ? `+${formatClock((elapsedSeconds - ANSWER_SECONDS) * 1000)}` : formatClock(remainingMs)}
            </span>
          )}
          <p className="text-sm/5 text-muted">
            {startedAt === null
              ? 'Say your answer out loud. Aim for about 2 minutes.'
              : overtime
                ? 'Past 2 minutes. Try wrapping up with the result.'
                : 'Situation, task, action, result.'}
          </p>
        </div>

        <div className="border-t border-line pt-5">
          <p className="mb-2 text-sm/5 font-semibold">How did it go?</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => rate('NAILED_IT')} disabled={loading}>
              Nailed it
            </Button>
            <Button variant="secondary" onClick={() => rate('NEEDS_WORK')} disabled={loading}>
              Needs work
            </Button>
            <Button variant="ghost" onClick={nextQuestion}>
              <ShuffleIcon /> Skip question
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
