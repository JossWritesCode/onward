import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import type { ActivityCategory, ActivityKind } from '../../gql/graphql';
import { ContactsQuery, CustomActionsQuery, JobApplicationsQuery, LogActivityMutation } from '../../graphql/operations';
import { CATEGORY_LABELS, LOGGABLE } from '../../lib/activities';
import { celebrateWin } from '../../lib/celebrate';
import { ChatIcon, CoffeeIcon, FileTextIcon, PencilIcon, PlusIcon, ReplyIcon, StarIcon } from '../icons';
import { Button, Card, ErrorBanner, Field, Input, Select } from '../ui';
import { CustomActionForm } from './CustomActionForm';

const ICONS: Partial<Record<ActivityKind, ReactNode>> = {
  NETWORKING_MESSAGE: <ChatIcon />,
  COFFEE_CHAT: <CoffeeIcon />,
  FOLLOW_UP: <ReplyIcon />,
  TAILORED_MATERIALS: <FileTextIcon />,
};

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
  const lastButton = useRef<HTMLElement | null>(null);

  const { data: applicationsData } = useQuery(JobApplicationsQuery);
  const { data: contactsData } = useQuery(ContactsQuery);
  const { data: customData } = useQuery(CustomActionsQuery);
  const [logActivity, { loading }] = useMutation(LogActivityMutation, {
    refetchQueries: ['Progress', 'Streak', 'Contacts', 'Today'],
  });

  const options: Option[] = [
    ...LOGGABLE.map((option) => ({ key: option.kind, ...option, icon: ICONS[option.kind] })),
    ...(customData?.customActions ?? []).map((action) => ({
      key: `custom:${action.id}`,
      kind: 'CUSTOM' as const,
      title: action.name,
      hint: CATEGORY_LABELS[action.category],
      icon: <StarIcon />,
      customAction: action,
    })),
  ];
  const chosen = options.find((option) => option.key === chosenKey);
  const kind = chosen?.kind ?? null;

  function choose(next: string, button: HTMLElement) {
    lastButton.current = button;
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
      const rect = lastButton.current?.getBoundingClientRect();
      celebrateWin(chosen.kind, rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined);
      setChosenKey(null);
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
        {options.map((option) => {
          const active = option.key === chosenKey;
          return (
            <button
              key={option.key}
              type="button"
              aria-expanded={active}
              onClick={(e) => choose(option.key, e.currentTarget)}
              className={`flex flex-col items-start gap-2 rounded-2xl border-2 border-b-4 p-3 text-left transition active:translate-y-0.5 active:border-b-2 ${
                active
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50'
                  : 'border-stone-200 bg-white hover:border-brand-300 dark:border-stone-700 dark:bg-stone-900'
              }`}
            >
              <span
                className={`flex size-10 items-center justify-center rounded-xl text-xl ${
                  option.customAction
                    ? 'bg-gold-100 text-gold-500 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-brand-100 text-brand-600 dark:bg-brand-900/60 dark:text-brand-300'
                }`}
              >
                {option.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold break-words">{option.title}</span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">{option.hint}</span>
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
          className={`flex flex-col items-start gap-2 rounded-2xl border-2 border-dashed p-3 text-left transition ${
            creating
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50'
              : 'border-stone-300 text-stone-500 hover:border-brand-300 hover:text-stone-700 dark:border-stone-700 dark:text-stone-400'
          }`}
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-stone-100 text-xl dark:bg-stone-800">
            <PlusIcon />
          </span>
          <span>
            <span className="block font-extrabold">Your own</span>
            <span className="block text-xs">Add an action, like a meetup</span>
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
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl bg-stone-100 p-4 dark:bg-stone-800/60" noValidate>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 font-extrabold">{chosen.title}</p>
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
    </Card>
  );
}
