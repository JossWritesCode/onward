import { useQuery } from '@apollo/client';
import { Link } from 'react-router';
import { ContactsQuery } from '../graphql/operations';
import { formatDate } from '../lib/format';
import { BriefcaseIcon, CalendarIcon, MailIcon, PlusIcon } from '../components/icons';
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
          illustration={<AddressCards />}
          title="Add your first contact"
          body="Keep track of the people you meet. A friendly check-in is often what turns an application into an interview."
          action={addButton}
        />
      )}

      {contacts.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {contacts.map((contact) => {
            const lastContacted = formatDate(contact.lastContactedOn);
            const headline = [contact.title, contact.company].filter(Boolean).join(' at ');
            return (
              <li key={contact.id}>
                <Link
                  to={`/contacts/${contact.id}`}
                  className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  <Card className="flex h-full gap-4 p-5 transition hover:border-control">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-link">
                      {initials(contact.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg/6 font-semibold">{contact.name}</p>
                      {headline && <p className="mt-0.5 truncate text-muted">{headline}</p>}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]/[18px] text-muted">
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

/** Two address cards, one tucked behind the other, each with a line for a name. Only for this page's empty state. */
function AddressCards() {
  return (
    <svg width="104" height="72" viewBox="0 0 104 72" fill="none" aria-hidden="true" className="text-muted">
      <rect x="28" y="4" width="72" height="44" rx="6" className="fill-page" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="22" width="72" height="44" rx="6" className="fill-surface" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="40" r="6" className="stroke-link" strokeWidth="1.5" />
      <path d="M32 37h30" className="stroke-link" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 45h20M14 55h48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
