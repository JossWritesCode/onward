import { useQuery } from '@apollo/client';
import { Link } from 'react-router';
import { PrepQuery } from '../graphql/operations';
import { formatDay, plural } from '../lib/activities';
import InterviewRoundCard from '../components/prep/InterviewRoundCard';
import PracticePanel from '../components/prep/PracticePanel';
import StudyTimer from '../components/prep/StudyTimer';
import { ColumnsIcon, PlusIcon } from '../components/icons';
import { ButtonLink, Card, ErrorBanner, PageHeader, Spinner } from '../components/ui';

export default function PrepPage() {
  const { data, loading, error } = useQuery(PrepQuery);

  if (error) return <ErrorBanner messages={[error.message]} />;
  if (loading && !data) return <Spinner />;
  if (!data) return null;

  const { upcomingInterviewRounds: rounds, stories, questions, studyTopics } = data;
  // The soonest interview that has a date, so it stands out from the rest.
  const now = new Date().toISOString();
  const nextId = rounds
    .filter((round) => round.scheduledAt && round.scheduledAt >= now)
    .sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1))[0]?.id;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Interview prep"
        subtitle="Practice a little at a time, and walk into every interview ready."
        action={
          <ButtonLink to="/prep/customize" variant="ghost">
            <ColumnsIcon /> Customize questions and checklist
          </ButtonLink>
        }
      />

      <section className="mb-10" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-4 font-serif text-[26px]/8 font-medium">
          Upcoming interviews
        </h2>
        {rounds.length === 0 ? (
          <Card className="p-6 text-muted">
            When you move a card into an interview column on your board, its prep checklist shows up here.
          </Card>
        ) : (
          <div className={`grid gap-4 ${rounds.length > 1 ? 'md:grid-cols-2' : ''}`}>
            {rounds.map((round) => (
              <InterviewRoundCard
                key={round.id}
                round={round}
                company={round.jobApplication.company}
                wide={rounds.length === 1}
                next={round.id === nextId && rounds.length > 1}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="min-w-0" aria-labelledby="practice-heading">
          <h2 id="practice-heading" className="mb-4 font-serif text-[26px]/8 font-medium">
            Practice
          </h2>
          <PracticePanel questions={questions} stories={stories} />
        </section>

        <section aria-labelledby="study-heading">
          <h2 id="study-heading" className="mb-4 font-serif text-[26px]/8 font-medium">
            Study
          </h2>
          <StudyTimer topics={studyTopics} />
        </section>
      </div>

      <section className="mt-10" aria-labelledby="stories-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="stories-heading" className="font-serif text-[26px]/8 font-medium">
              Story bank
            </h2>
            <p className="mt-1 text-muted">
              Write your best stories once, then reuse them for any behavioral question.
            </p>
          </div>
          <ButtonLink to="/prep/stories/new">
            <PlusIcon /> Add story
          </ButtonLink>
        </div>

        {stories.length === 0 ? (
          <Card className="p-6 text-muted">
            Start with 3 to 5 stories: a project you're proud of, a time you handled conflict, a mistake you learned
            from, a time you led something. They'll cover most questions you'll hear.
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <li key={story.id}>
                <Link
                  to={`/prep/stories/${story.id}`}
                  className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <Card className="h-full p-4 transition hover:border-control">
                    <p className="font-semibold">{story.title}</p>
                    {story.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {story.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-tint px-2 py-0.5 text-xs font-semibold text-tint-ink"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-[13px]/[18px] text-muted">
                      {story.practiceCount === 0
                        ? 'Not practiced yet'
                        : `Practiced ${plural(story.practiceCount, 'time')}${
                            story.lastPracticedOn ? `, last on ${formatDay(story.lastPracticedOn)}` : ''
                          }`}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
