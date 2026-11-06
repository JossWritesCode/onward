import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import type { ActivityKind } from '../../gql/graphql';
import { ContactsQuery, JobApplicationsQuery, LogActivityMutation } from '../../graphql/operations';
import { LOGGABLE } from '../../lib/activities';
import { celebrateWin } from '../../lib/celebrate';
import { ChatIcon, CoffeeIcon, FileTextIcon, ReplyIcon } from '../icons';
import { Button, Card, ErrorBanner, Field, Input, Select } from '../ui';

const ICONS: Partial<Record<ActivityKind, ReactNode>> = {
  NETWORKING_MESSAGE: <ChatIcon />,
  COFFEE_CHAT: <CoffeeIcon />,
  FOLLOW_UP: <ReplyIcon />,
  TAILORED_MATERIALS: <FileTextIcon />,
};

/** Buttons for logging the work that doesn't happen on the board. */
export default function LogWin() {
  const [kind, setKind] = useState<ActivityKind | null>(null);
  const [jobApplicationId, setJobApplicationId] = useState('');
  const [contactId, setContactId] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const lastButton = useRef<HTMLElement | null>(null);

  const { data: applicationsData } = useQuery(JobApplicationsQuery);
  const { data: contactsData } = useQuery(ContactsQuery);
  const [logActivity, { loading }] = useMutation(LogActivityMutation, { refetchQueries: ['Progress', 'Streak', 'Contacts'] });

  const chosen = LOGGABLE.find((option) => option.kind === kind);

  function choose(next: ActivityKind, button: HTMLElement) {
    lastButton.current = button;
    setKind(next === kind ? null : next);
    setErrors([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!kind) return;
    try {
      const { data } = await logActivity({
        variables: {
          kind,
          jobApplicationId: jobApplicationId || null,
          contactId: contactId || null,
          note: note.trim() || null,
        },
      });
      const result = data?.logActivity;
      if (!result?.activity) {
        setErrors(result?.errors.map((error) => error.message) ?? ['Something went wrong. Try again.']);
        return;
      }
      const rect = lastButton.current?.getBoundingClientRect();
      celebrateWin(kind, rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined);
      setKind(null);
      setJobApplicationId('');
      setContactId('');
      setNote('');
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Something went wrong. Try again.']);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="text-xl font-black">Log a win</h2>
      <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
        The work that doesn't happen on the board counts too. Applications and interviews are logged for you.
      </p>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {LOGGABLE.map((option) => {
          const active = option.kind === kind;
          return (
            <button
              key={option.kind}
              type="button"
              aria-expanded={active}
              onClick={(e) => choose(option.kind, e.currentTarget)}
              className={`flex flex-col items-start gap-2 rounded-2xl border-2 border-b-4 p-3 text-left transition active:translate-y-0.5 active:border-b-2 ${
                active
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50'
                  : 'border-stone-200 bg-white hover:border-brand-300 dark:border-stone-700 dark:bg-stone-900'
              }`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-xl text-brand-600 dark:bg-brand-900/60 dark:text-brand-300">
                {ICONS[option.kind]}
              </span>
              <span>
                <span className="block font-extrabold">{option.title}</span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">{option.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {chosen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl bg-stone-100 p-4 dark:bg-stone-800/60" noValidate>
          <p className="font-extrabold">{chosen.title}</p>
          <ErrorBanner messages={errors} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="For which application? (optional)" htmlFor="win-application">
              <Select id="win-application" value={jobApplicationId} onChange={(e) => setJobApplicationId(e.target.value)}>
                <option value="">None</option>
                {(applicationsData?.jobApplications ?? []).map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.company} · {application.role}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="With whom? (optional)"
              htmlFor="win-contact"
              hint={kind !== 'TAILORED_MATERIALS' ? 'Updates their "last talked" date.' : undefined}
            >
              <Select id="win-contact" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                <option value="">None</option>
                {(contactsData?.contacts ?? []).map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Note (optional)" htmlFor="win-note">
            <Input id="win-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened?" maxLength={500} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Logging…' : 'Log it'}
            </Button>
            <Button variant="ghost" onClick={() => setKind(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
