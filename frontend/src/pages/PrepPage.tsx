import { useQuery } from '@apollo/client';
import { Link } from 'react-router';
import { PrepQuery } from '../graphql/operations';
import { formatDay, plural } from '../lib/activities';
import InterviewRoundCard from '../components/prep/InterviewRoundCard';
import PrepTabs from '../components/prep/PrepTabs';
import PracticePanel from '../components/prep/PracticePanel';
import StudyTimer from '../components/prep/StudyTimer';
import { BookIcon, CalendarIcon, ColumnsIcon, PlusIcon } from '../components/icons';
import { ButtonLink, Card, ErrorBanner, PageHeader, Spinner } from '../components/ui';

export default function PrepPage() {
  const { data, loading, error } = useQuery(PrepQuery);

  if (error) return <ErrorBanner messages={[error.message]} />;
  if (loading && !data) return <Spinner />;
  if (!data) return null;

  const { upcomingInterviewRounds: rounds, stories, questions, studyTopics } = data;

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
      <PrepTabs />

      <section className="mb-8" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-3 flex items-center gap-2 text-xl font-black">
          <CalendarIcon className="text-brand-500" /> Upcoming interviews
        </h2>
        {rounds.length === 0 ? (
          <Card className="p-5 text-stone-500 dark:text-stone-400">
            When you move a card into an interview column on your board, its prep checklist shows up here.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rounds.map((round) => (
              <InterviewRoundCard key={round.id} round={round} company={round.jobApplication.company} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <section className="min-w-0" aria-labelledby="practice-heading">
          <h2 id="practice-heading" className="mb-3 text-xl font-black">
            Practice
          </h2>
          <PracticePanel questions={questions} stories={stories} />
        </section>

        <section aria-labelledby="study-heading">
          <h2 id="study-heading" className="mb-3 text-xl font-black">
            Study
          </h2>
          <StudyTimer topics={studyTopics} />
        </section>
      </div>

      <section className="mt-8" aria-labelledby="stories-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="stories-heading" className="flex items-center gap-2 text-xl font-black">
              <BookIcon className="text-brand-500" /> Story bank
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Write your best stories once, then reuse them for any behavioral question.
            </p>
          </div>
          <ButtonLink to="/prep/stories/new">
            <PlusIcon /> Add story
          </ButtonLink>
        </div>

        {stories.length === 0 ? (
          <Card className="p-5 text-stone-500 dark:text-stone-400">
            Start with 3 to 5 stories: a project you're proud of, a time you handled conflict, a mistake you learned
            from, a time you led something. They'll cover most questions you'll hear.
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <li key={story.id}>
                <Link
                  to={`/prep/stories/${story.id}`}
                  className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
                >
                  <Card className="h-full p-4 transition hover:border-brand-300 dark:hover:border-brand-700">
                    <p className="font-extrabold">{story.title}</p>
                    {story.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {story.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
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
