import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router';
import type { EngineeringQuery as EngineeringQueryData } from '../gql/graphql';
import { EngineeringQuery, LogStudySessionMutation, RefreshIntegrationsMutation } from '../graphql/operations';
import { addDays, formatDay, mondayOf } from '../lib/activities';
import { celebrateStudy } from '../lib/celebrate';
import { formatMinutes, hoursDecimal, todayIso } from '../lib/format';
import CalendarHeatMap from '../components/CalendarHeatMap';
import { ExternalLinkIcon, FlameIcon, GearIcon, PlusIcon, RefreshIcon, TimerIcon } from '../components/icons';
import { Button, ButtonLink, Card, ErrorBanner, Field, Input, PageHeader, Select, Spinner } from '../components/ui';

type Engineering = EngineeringQueryData['engineering'];

export default function EngineeringPage() {
  const { data, loading, error } = useQuery(EngineeringQuery);
  const [refresh, { loading: refreshing }] = useMutation(RefreshIntegrationsMutation, {
    refetchQueries: ['Streak', 'Progress'],
  });

  if (error) return <ErrorBanner messages={[error.message]} />;
  if (loading && !data) return <Spinner />;
  if (!data) return null;

  const today = todayIso();
  const { leetcode, github, study } = data.engineering;

  if (!data.me?.engineeringTrack) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Engineering" />
        <Card className="p-6">
          <p className="mb-4 text-muted">
            The software engineering track adds your LeetCode streak, your GitHub contributions, and your study hours
            to the Prep page.
          </p>
          <ButtonLink to="/settings#engineering">Turn it on</ButtonLink>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Engineering"
        subtitle="Your coding practice, all in one place."
        action={
          <div className="flex flex-wrap gap-1">
            {(leetcode || github) && (
              <Button variant="ghost" onClick={() => refresh()} disabled={refreshing}>
                <RefreshIcon className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            )}
            <ButtonLink to="/settings#engineering" variant="ghost">
              <GearIcon /> Settings
            </ButtonLink>
          </div>
        }
      />

      <div className="space-y-6">
        <LeetcodeCard leetcode={leetcode} today={today} />
        <GithubCard github={github} today={today} />
        <StudyCard study={study} topics={data.studyTopics} today={today} />
      </div>
    </div>
  );
}

function ConnectPrompt({ service, what }: { service: string; what: string }) {
  return (
    <p className="text-muted">
      Add your {service} username in{' '}
      <Link to="/settings#engineering" className="font-semibold text-link hover:underline">
        Settings
      </Link>{' '}
      to see {what}.
    </p>
  );
}

function StaleNote({ error, fetchedAt }: { error?: string | null; fetchedAt?: string | null }) {
  if (!error) return null;
  return (
    <p className="mb-4 rounded-lg border border-gold-300 bg-gold-100 px-3 py-2 text-sm text-gold-700 dark:border-amber-900 dark:bg-gold-night dark:text-gold-200">
      {error}
      {fetchedAt && ' Showing the last data Onward saved.'}
    </p>
  );
}

function LeetcodeCard({ leetcode, today }: { leetcode: Engineering['leetcode']; today: string }) {
  const difficulties = leetcode
    ? [
        { label: 'Easy', solved: leetcode.easySolved, total: leetcode.easyTotal, color: 'bg-emerald-500' },
        { label: 'Medium', solved: leetcode.mediumSolved, total: leetcode.mediumTotal, color: 'bg-gold-400' },
        { label: 'Hard', solved: leetcode.hardSolved, total: leetcode.hardTotal, color: 'bg-rose-500' },
      ]
    : [];
  const solved = difficulties.reduce((sum, d) => sum + d.solved, 0);

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[22px]/7 font-semibold">LeetCode</h2>
        {leetcode && (
          <a
            href={`https://leetcode.com/u/${leetcode.username}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm/5 font-semibold text-link hover:underline"
          >
            {leetcode.username} <ExternalLinkIcon />
          </a>
        )}
      </div>

      {!leetcode ? (
        <ConnectPrompt service="LeetCode" what="your streak and solved problems" />
      ) : (
        <>
          <StaleNote error={leetcode.error} fetchedAt={leetcode.fetchedAt} />
          {/* Your own pattern of practice comes first, then the numbers behind it. */}
          <CalendarHeatMap days={leetcode.days} today={today} scale="amber" unit="submission" />
          <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-[auto_1fr] sm:items-start">
            <div>
              <p className="flex items-center gap-2">
                <span className="text-[40px]/[44px] font-semibold tabular-nums">{leetcode.streak}</span>
                <span className="text-muted">{leetcode.streak === 1 ? 'day' : 'days'}</span>
                <FlameIcon className="text-xl text-gold-500" />
              </p>
              <p className="text-sm/5 text-muted">LeetCode streak</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm/5 text-muted">
                <span className="text-lg font-semibold text-ink tabular-nums">{solved}</span> solved ·{' '}
                <span className="tabular-nums">{leetcode.totalActiveDays}</span> active days this year
              </p>
              {difficulties.map((d) => (
                <div key={d.label} className="flex items-center gap-3 text-sm/5">
                  <span className="w-16 font-medium">{d.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                    <div
                      className={`h-full rounded-full ${d.color}`}
                      style={{ width: `${d.total > 0 ? Math.max(1, (d.solved / d.total) * 100) : 0}%` }}
                    />
                  </div>
                  {/* Solved and total each get a fixed column, so the slashes line up. */}
                  <span className="grid w-24 shrink-0 grid-cols-[1fr_auto_1fr] gap-1 text-muted tabular-nums">
                    <span className="text-right font-medium text-ink">{d.solved}</span>
                    {d.total > 0 ? (
                      <>
                        <span>/</span>
                        <span>{d.total}</span>
                      </>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-[13px]/[18px] text-muted">
            Any day with a submission counts toward your Onward streak, on your own clock. This calendar is
            LeetCode's, which runs on UTC, so a late-night submission can show up here on the next day.
          </p>
        </>
      )}
    </Card>
  );
}

function GithubCard({ github, today }: { github: Engineering['github']; today: string }) {
  const weekStart = mondayOf(today);
  const thisWeek = github?.days.filter((d) => d.date >= weekStart && d.date <= today).reduce((sum, d) => sum + d.count, 0) ?? 0;

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[22px]/7 font-semibold">GitHub</h2>
        {github && (
          <a
            href={`https://github.com/${github.username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm/5 font-semibold text-link hover:underline"
          >
            {github.username} <ExternalLinkIcon />
          </a>
        )}
      </div>
      {!github ? (
        <ConnectPrompt service="GitHub" what="your contributions" />
      ) : (
        <>
          <StaleNote error={github.error} fetchedAt={github.fetchedAt} />
          {github.days.length > 0 && <CalendarHeatMap days={github.days} today={today} scale="green" unit="contribution" />}
          {github.fetchedAt && !github.error && (
            <p className="mt-5 text-sm/5 text-muted">
              <span className="text-lg font-semibold text-ink tabular-nums">{github.totalContributions}</span>{' '}
              contributions in the last year · <span className="font-semibold text-ink tabular-nums">{thisWeek}</span> this week
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function StudyCard({
  study,
  topics,
  today,
}: {
  study: Engineering['study'];
  topics: readonly string[];
  today: string;
}) {
  const maxWeek = Math.max(60, ...study.weeks.map((w) => w.minutes));
  const maxTopic = Math.max(1, ...study.byTopic.map((t) => t.minutes));

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[22px]/7 font-semibold">
          <TimerIcon className="text-muted" /> Hours studied
        </h2>
        <Link to="/prep" className="text-sm/5 font-semibold text-link hover:underline">
          Study timer is on Prep
        </Link>
      </div>

      <dl className="mb-6 grid grid-cols-3 gap-4 border-b border-line pb-5">
        {[
          ['This week', study.minutesThisWeek],
          ['This month', study.minutesThisMonth],
          ['All time', study.minutesTotal],
        ].map(([label, minutes]) => (
          <div key={label} className="flex flex-col">
            <dt className="order-2 text-[13px]/[18px] text-muted">{label}</dt>
            <dd className="order-1 text-[28px]/9 font-semibold tabular-nums">
              {hoursDecimal(Number(minutes))}
              <span className="text-sm font-medium text-muted"> h</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm/5 font-semibold">Last 12 weeks</h3>
          <div className="flex h-32 items-end gap-1" role="img" aria-label="Hours studied per week for the last 12 weeks">
            {study.weeks.map((week) => (
              <div key={week.weekStart} className="flex h-full flex-1 flex-col justify-end" title={`Week of ${formatDay(week.weekStart)}: ${formatMinutes(week.minutes)}`}>
                <div
                  className={`rounded-t-md ${week.weekStart === mondayOf(today) ? 'bg-brand-500' : 'bg-brand-300 dark:bg-brand-700'}`}
                  style={{ height: `${(week.minutes / maxWeek) * 100}%`, minHeight: week.minutes > 0 ? 4 : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted">
            <span>{study.weeks[0] && formatDay(study.weeks[0].weekStart)}</span>
            <span>This week</span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm/5 font-semibold">By topic</h3>
          {study.byTopic.length === 0 ? (
            <p className="text-sm/5 text-muted">No study time yet. The timer and "Add time" both count.</p>
          ) : (
            <ul className="space-y-2">
              {study.byTopic.slice(0, 6).map((t) => (
                <li key={t.topic} className="text-sm">
                  <div className="mb-0.5 flex justify-between gap-2">
                    <span className="truncate font-medium">{t.topic}</span>
                    <span className="shrink-0 text-muted tabular-nums">{formatMinutes(t.minutes)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(t.minutes / maxTopic) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AddTimeForm topics={topics} today={today} />
    </Card>
  );
}

/** For studying you did away from the timer, like reading on the train. */
function AddTimeForm({ topics, today }: { topics: readonly string[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(topics[0] ?? '');
  const [minutes, setMinutes] = useState('');
  const [day, setDay] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [logStudySession, { loading }] = useMutation(LogStudySessionMutation, {
    refetchQueries: ['Engineering', 'Streak', 'Progress'],
  });

  const days = Array.from({ length: 8 }, (_, i) => addDays(today, -i));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(minutes);
    if (!topic.trim()) return setError('Add what you studied.');
    if (!Number.isInteger(value) || value < 10 || value > 480) return setError('Enter between 10 and 480 minutes.');

    const { data } = await logStudySession({ variables: { topic, minutes: value, studiedOn: day } });
    const result = data?.logStudySession;
    if (result?.counted) {
      celebrateStudy(value, topic.trim());
      setMinutes('');
      setError(null);
      setOpen(false);
    } else {
      setError(result?.errors.map((e) => e.message).join(' ') || "That didn't save. Try again.");
    }
  }

  if (!open) {
    return (
      <div className="mt-6 border-t border-line pt-5">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <PlusIcon /> Add time
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-[1fr_8rem_10rem_auto] sm:items-end"
    >
      <Field label="What did you study?" htmlFor="add-time-topic">
        <Input id="add-time-topic" list="add-time-topics" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={60} />
        <datalist id="add-time-topics">
          {topics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>
      <Field label="Minutes" htmlFor="add-time-minutes">
        <Input id="add-time-minutes" type="number" min={10} max={480} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
      </Field>
      <Field label="When" htmlFor="add-time-day">
        <Select id="add-time-day" value={day} onChange={(e) => setDay(e.target.value)}>
          {days.map((d, i) => (
            <option key={d} value={d}>
              {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatDay(d, { weekday: 'short', month: 'short', day: 'numeric' })}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          Add
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm font-semibold text-rose-600 sm:col-span-4 dark:text-rose-400">{error}</p>}
      <p className="text-[13px]/[18px] text-muted sm:col-span-4">
        For studying away from the timer. Sessions of 10 minutes or more count toward your streak.
      </p>
    </form>
  );
}
