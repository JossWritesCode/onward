import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router';
import type { JobApplicationStatus, JobApplicationsQuery as JobApplicationsQueryData } from '../gql/graphql';
import { JobApplicationsQuery, UpdateJobApplicationMutation } from '../graphql/operations';
import { formatDate } from '../lib/format';
import { STATUSES, STATUS_LABELS, STATUS_STYLES, WORK_ARRANGEMENT_LABELS } from '../lib/status';
import { BriefcaseIcon, CalendarIcon, MapPinIcon, PlusIcon, UsersIcon } from '../components/icons';
import { ButtonLink, Card, EmptyState, ErrorBanner, PageHeader, Spinner } from '../components/ui';

type Filter = 'ALL' | JobApplicationStatus;
type JobApplicationRow = JobApplicationsQueryData['jobApplications'][number];

export default function ApplicationsPage() {
  const { data, loading, error } = useQuery(JobApplicationsQuery);
  const [filter, setFilter] = useState<Filter>('ALL');

  const applications = useMemo(() => data?.jobApplications ?? [], [data]);
  const counts = useMemo(() => {
    const result = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<JobApplicationStatus, number>;
    for (const application of applications) result[application.status] += 1;
    return result;
  }, [applications]);
  const visible = filter === 'ALL' ? applications : applications.filter((a) => a.status === filter);

  const addButton = (
    <ButtonLink to="/applications/new">
      <PlusIcon />
      Add application
    </ButtonLink>
  );

  return (
    <>
      <PageHeader
        title="Your applications"
        subtitle={
          applications.length > 0
            ? `${applications.length} tracked, ${counts.INTERVIEWING} interviewing`
            : 'Everything you apply to, all in one place.'
        }
        action={applications.length > 0 ? addButton : undefined}
      />

      {error && <ErrorBanner messages={[error.message]} />}
      {loading && !data && <Spinner />}

      {data && applications.length === 0 && (
        <EmptyState
          icon={<BriefcaseIcon />}
          title="Log your first application"
          body="Add a job you've applied to, or one you're saving for later. Every one you log is a step forward."
          action={addButton}
        />
      )}

      {applications.length > 0 && (
        <>
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter by status">
            <FilterPill label="All" count={applications.length} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
            {STATUSES.map((status) => (
              <FilterPill
                key={status}
                label={STATUS_LABELS[status]}
                count={counts[status]}
                active={filter === status}
                onClick={() => setFilter(status)}
              />
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="py-10 text-center text-stone-500 dark:text-stone-400">
              Nothing marked {STATUS_LABELS[filter as JobApplicationStatus].toLowerCase()} right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((application) => (
                <li key={application.id}>
                  <ApplicationCard application={application} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-extrabold transition ${
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-stone-200 bg-white text-stone-600 hover:border-brand-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
      }`}
    >
      {label}
      <span className={active ? 'text-brand-100' : 'text-stone-400'}>{count}</span>
    </button>
  );
}

function ApplicationCard({ application }: { application: JobApplicationRow }) {
  const [updateApplication, { loading }] = useMutation(UpdateJobApplicationMutation);
  const applied = formatDate(application.dateApplied);
  const where = [
    application.location,
    application.workArrangement ? WORK_ARRANGEMENT_LABELS[application.workArrangement] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className="flex flex-col gap-3 p-4 transition hover:border-brand-300 sm:flex-row sm:items-center dark:hover:border-brand-700">
      <Link to={`/applications/${application.id}`} className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30">
        <p className="truncate text-lg font-extrabold">{application.company}</p>
        <p className="truncate text-stone-600 dark:text-stone-300">{application.role}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
          {applied && (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon /> Applied {applied}
            </span>
          )}
          {where && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon /> {where}
            </span>
          )}
          {application.contacts.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <UsersIcon /> {application.contacts.map((c) => c.name).join(', ')}
            </span>
          )}
        </div>
      </Link>

      <label className="sr-only" htmlFor={`status-${application.id}`}>
        Status for {application.company}
      </label>
      <select
        id={`status-${application.id}`}
        value={application.status}
        disabled={loading}
        onChange={(e) =>
          updateApplication({
            variables: { id: application.id, input: { status: e.target.value as JobApplicationStatus } },
          })
        }
        className={`w-full cursor-pointer rounded-xl border-0 px-3 py-2 font-extrabold sm:w-40 ${STATUS_STYLES[application.status]}`}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </Card>
  );
}
