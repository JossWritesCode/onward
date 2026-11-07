import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router';
import type { EngineeringQuery as EngineeringQueryData } from '../gql/graphql';
import { EngineeringQuery, LogStudySessionMutation, RefreshIntegrationsMutation } from '../graphql/operations';
import { addDays, formatDay, mondayOf } from '../lib/activities';
import { celebrateStudy } from '../lib/celebrate';
import { formatMinutes, hoursDecimal, todayIso } from '../lib/format';
import CalendarHeatMap from '../components/CalendarHeatMap';
import { ColumnsIcon, ExternalLinkIcon, FlameIcon, PlusIcon, RefreshIcon, TimerIcon } from '../components/icons';
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
          <p className="mb-4 text-stone-600 dark:text-stone-300">
            The software engineering track adds your LeetCode streak, your GitHub contributions, and your study hours
            to the Prep page.
          </p>
          <ButtonLink to="/prep/customize">Turn it on</ButtonLink>
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
            <ButtonLink to="/prep/customize" variant="ghost">
              <ColumnsIcon /> Settings
            </ButtonLink>
          </div>
        }
      />

      <div className="space-y-5">
        <LeetcodeCard leetcode={leetcode} today={today} />
        <GithubCard github={github} today={today} />
        <StudyCard study={study} topics={data.studyTopics} today={today} />
      </div>
    </div>
  );
}

function ConnectPrompt({ service, what }: { service: string; what: string }) {
  return (
    <p className="text-stone-500 dark:text-stone-400">
      Add your {service} username in{' '}
      <Link to="/prep/customize" className="font-bold text-brand-600 hover:underline dark:text-brand-300">
        prep settings
      </Link>{' '}
      to see {what}.
    </p>
  );
}

function StaleNote({ error, fetchedAt }: { error?: string | null; fetchedAt?: string | null }) {
  if (!error) return null;
  return (
    <p className="mb-3 rounded-xl bg-gold-100 px-3 py-2 text-sm text-gold-700 dark:bg-amber-900/40 dark:text-amber-200">
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
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black">LeetCode</h2>
        {leetcode && (
          <a
            href={`https://leetcode.com/u/${leetcode.username}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
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
          <div className="mb-5 grid gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-3 rounded-2xl bg-gold-100 px-4 py-3 dark:bg-amber-900/30">
              <FlameIcon className="text-3xl text-gold-500" />
              <div>
                <p className="text-2xl font-black text-gold-700 tabular-nums dark:text-amber-200">
                  {leetcode.streak} {leetcode.streak === 1 ? 'day' : 'days'}
                </p>
                <p className="text-sm font-bold text-gold-700 dark:text-amber-200">LeetCode streak</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                <span className="text-lg font-black text-stone-800 dark:text-stone-100">{solved}</span> solved ·{' '}
                {leetcode.totalActiveDays} active days this year
              </p>
              {difficulties.map((d) => (
                <div key={d.label} className="flex items-center gap-3 text-sm">
                  <span className="w-16 font-bold">{d.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <div
                      className={`h-full rounded-full ${d.color}`}
                      style={{ width: `${d.total > 0 ? Math.max(1, (d.solved / d.total) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-stone-500 tabular-nums dark:text-stone-400">
                    {d.solved}
                    {d.total > 0 && ` / ${d.total}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <CalendarHeatMap days={leetcode.days} today={today} scale="amber" unit="submission" />
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
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
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black">GitHub</h2>
        {github && (
          <a
            href={`https://github.com/${github.username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
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
          {github.fetchedAt && !github.error && (
            <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
              <span className="text-lg font-black text-stone-800 dark:text-stone-100">{github.totalContributions}</span>{' '}
              contributions in the last year · <span className="font-bold">{thisWeek}</span> this week
            </p>
          )}
          {github.days.length > 0 && <CalendarHeatMap days={github.days} today={today} scale="green" unit="contribution" />}
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
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <TimerIcon className="text-brand-500" /> Hours studied
        </h2>
        <Link to="/prep" className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300">
          Study timer is on Prep
        </Link>
      </div>

      <dl className="mb-5 grid grid-cols-3 gap-2">
        {[
          ['This week', study.minutesThisWeek],
          ['This month', study.minutesThisMonth],
          ['All time', study.minutesTotal],
        ].map(([label, minutes]) => (
          <div key={label} className="rounded-xl bg-brand-50 px-3 py-3 dark:bg-brand-950/50">
            <dt className="text-xs font-bold text-stone-500 dark:text-stone-400">{label}</dt>
            <dd className="text-2xl font-black text-brand-600 tabular-nums dark:text-brand-300">
              {hoursDecimal(Number(minutes))}
              <span className="text-sm font-bold"> h</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-extrabold text-stone-700 dark:text-stone-300">Last 12 weeks</h3>
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
          <div className="mt-1 flex justify-between text-[10px] text-stone-400">
            <span>{study.weeks[0] && formatDay(study.weeks[0].weekStart)}</span>
            <span>This week</span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-extrabold text-stone-700 dark:text-stone-300">By topic</h3>
          {study.byTopic.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">No study time yet. The timer and "Add time" both count.</p>
          ) : (
            <ul className="space-y-2">
              {study.byTopic.slice(0, 6).map((t) => (
                <li key={t.topic} className="text-sm">
                  <div className="mb-0.5 flex justify-between gap-2">
                    <span className="truncate font-bold">{t.topic}</span>
                    <span className="shrink-0 text-stone-500 tabular-nums dark:text-stone-400">{formatMinutes(t.minutes)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
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
      <div className="mt-5 border-t-2 border-stone-100 pt-4 dark:border-stone-800">
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
      className="mt-5 grid gap-3 border-t-2 border-stone-100 pt-4 sm:grid-cols-[1fr_8rem_10rem_auto] sm:items-end dark:border-stone-800"
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
      <p className="text-xs text-stone-500 sm:col-span-4 dark:text-stone-400">
        For studying away from the timer. Sessions of 10 minutes or more count toward your streak.
      </p>
    </form>
  );
}
