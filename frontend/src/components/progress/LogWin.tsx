import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router';
import type { ActivityCategory, ActivityKind } from '../../gql/graphql';
import { ContactsQuery, CustomActionsQuery, JobApplicationsQuery, LogActivityMutation } from '../../graphql/operations';
import { CATEGORY_LABELS, LOGGABLE } from '../../lib/activities';
import { celebrateWin } from '../../lib/celebrate';
import { ChatIcon, CoffeeIcon, FileTextIcon, PencilIcon, PlusIcon, ReplyIcon, StarIcon } from '../icons';
import { Button, ErrorBanner, Field, Input, Select } from '../ui';
import { CustomActionForm } from './CustomActionForm';

const ICONS: Partial<Record<ActivityKind, ReactNode>> = {
  NETWORKING_MESSAGE: <ChatIcon strokeWidth={1.75} />,
  COFFEE_CHAT: <CoffeeIcon strokeWidth={1.75} />,
  FOLLOW_UP: <ReplyIcon strokeWidth={1.75} />,
  TAILORED_MATERIALS: <FileTextIcon strokeWidth={1.75} />,
};

// Each action is one row you can click anywhere on: no box until you point at it or tab to it.
const entry =
  'flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-stone-200/50 dark:hover:bg-stone-800 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus';
const entryActive = 'bg-tint hover:bg-tint';

type Option = {
  key: string;
  kind: ActivityKind;
  title: string;
  hint: string;
  icon: ReactNode;
  customAction?: { id: string; name: string; category: ActivityCategory };
};

/** Buttons for logging the work that doesn't happen on the board, including your own actions. */
export default function LogWin() {
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [jobApplicationId, setJobApplicationId] = useState('');
  const [contactId, setContactId] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const { data: applicationsData } = useQuery(JobApplicationsQuery);
  const { data: contactsData } = useQuery(ContactsQuery);
  const { data: customData } = useQuery(CustomActionsQuery);
  const [logActivity, { loading }] = useMutation(LogActivityMutation, {
    refetchQueries: ['Progress', 'Streak', 'Contacts', 'Today', 'Board'],
  });

  const options: Option[] = [
    ...LOGGABLE.map((option) => ({ key: option.kind, ...option, icon: ICONS[option.kind] })),
    ...(customData?.customActions ?? []).map((action) => ({
      key: `custom:${action.id}`,
      kind: 'CUSTOM' as const,
      title: action.name,
      hint: CATEGORY_LABELS[action.category],
      icon: <StarIcon strokeWidth={1.75} />,
      customAction: action,
    })),
  ];
  const chosen = options.find((option) => option.key === chosenKey);
  const kind = chosen?.kind ?? null;

  function choose(next: string) {
    setChosenKey(next === chosenKey ? null : next);
    setCreating(false);
    setEditing(false);
    setErrors([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosen) return;
    try {
      const { data } = await logActivity({
        variables: {
          kind: chosen.kind,
          jobApplicationId: jobApplicationId || null,
          contactId: contactId || null,
          customActionId: chosen.customAction?.id ?? null,
          note: note.trim() || null,
        },
      });
      const result = data?.logActivity;
      if (!result?.activity) {
        setErrors(result?.errors.map((error) => error.message) ?? ['Something went wrong. Try again.']);
        return;
      }
      celebrateWin(chosen.kind);
      setChosenKey(null);
      setJobApplicationId('');
      setContactId('');
      setNote('');
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Something went wrong. Try again.']);
    }
  }

  return (
    <section aria-labelledby="log-win-heading">
      <h2 id="log-win-heading" className="font-serif text-[26px]/8 font-medium">
        Log a win
      </h2>
      <p className="mt-1 mb-4 text-muted">
        The work that doesn't happen on the board counts too. Applications, interviews and{' '}
        <Link to="/prep" className="font-medium text-link underline-offset-2 hover:underline">
          interview prep
        </Link>{' '}
        are logged for you.
      </p>

      <div className="-mx-3 grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-1">
        {options.map((option) => {
          const active = option.key === chosenKey;
          return (
            <button
              key={option.key}
              type="button"
              aria-expanded={active}
              onClick={() => choose(option.key)}
              className={`${entry} ${active ? entryActive : ''}`}
            >
              <span className={`mt-0.5 shrink-0 text-xl ${option.customAction ? 'text-achieve' : 'text-link'}`}>
                {option.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold break-words">{option.title}</span>
                <span className="block text-[13px]/[18px] text-muted">{option.hint}</span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          aria-expanded={creating}
          onClick={() => {
            setCreating(!creating);
            setChosenKey(null);
            setErrors([]);
          }}
          className={`${entry} ${creating ? entryActive : ''}`}
        >
          <span className="mt-0.5 shrink-0 text-xl text-muted">
            <PlusIcon strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">Your own</span>
            <span className="block text-[13px]/[18px] text-muted">Add an action, like a meetup</span>
          </span>
        </button>
      </div>

      {creating && (
        <CustomActionForm
          onDone={(created) => {
            setCreating(false);
            if (created) setChosenKey(`custom:${created.id}`);
          }}
        />
      )}

      {chosen?.customAction && editing && (
        <CustomActionForm
          action={chosen.customAction}
          onDone={(_, deleted) => {
            setEditing(false);
            if (deleted) setChosenKey(null);
          }}
        />
      )}

      {chosen && !editing && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5" noValidate>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 font-semibold">{chosen.title}</p>
            {chosen.customAction && (
              <Button variant="ghost" className="text-sm" onClick={() => setEditing(true)}>
                <PencilIcon /> Edit action
              </Button>
            )}
          </div>
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
              hint={
                kind === 'NETWORKING_MESSAGE' || kind === 'COFFEE_CHAT' || kind === 'FOLLOW_UP'
                  ? 'Updates their "last talked" date.'
                  : undefined
              }
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
            <Button variant="ghost" onClick={() => setChosenKey(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
