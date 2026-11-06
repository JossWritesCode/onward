import { useQuery } from '@apollo/client';
import { Link } from 'react-router';
import { ContactsQuery } from '../graphql/operations';
import { formatDate } from '../lib/format';
import { BriefcaseIcon, CalendarIcon, MailIcon, PlusIcon, UsersIcon } from '../components/icons';
import { ButtonLink, Card, EmptyState, ErrorBanner, PageHeader, Spinner } from '../components/ui';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export default function ContactsPage() {
  const { data, loading, error } = useQuery(ContactsQuery);
  const contacts = data?.contacts ?? [];

  const addButton = (
    <ButtonLink to="/contacts/new">
      <PlusIcon />
      Add contact
    </ButtonLink>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Your contacts"
        subtitle={
          contacts.length > 0
            ? `${contacts.length} ${contacts.length === 1 ? 'person' : 'people'} in your corner`
            : 'Recruiters, referrals, and everyone you meet along the way.'
        }
        action={contacts.length > 0 ? addButton : undefined}
      />

      {error && <ErrorBanner messages={[error.message]} />}
      {loading && !data && <Spinner />}

      {data && contacts.length === 0 && (
        <EmptyState
          icon={<UsersIcon />}
          title="Add your first contact"
          body="Keep track of the people you meet. A friendly check-in is often what turns an application into an interview."
          action={addButton}
        />
      )}

      {contacts.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => {
            const lastContacted = formatDate(contact.lastContactedOn);
            const headline = [contact.title, contact.company].filter(Boolean).join(' at ');
            return (
              <li key={contact.id}>
                <Link
                  to={`/contacts/${contact.id}`}
                  className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
                >
                  <Card className="flex h-full gap-3 p-4 transition hover:border-brand-300 dark:hover:border-brand-700">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 font-black text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
                      {initials(contact.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold">{contact.name}</p>
                      {headline && <p className="truncate text-stone-600 dark:text-stone-300">{headline}</p>}
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
                        {contact.email && (
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MailIcon /> <span className="truncate">{contact.email}</span>
                          </span>
                        )}
                        {lastContacted && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon /> Last talked {lastContacted}
                          </span>
                        )}
                        {contact.jobApplications.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <BriefcaseIcon /> {contact.jobApplications.map((a) => a.company).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
