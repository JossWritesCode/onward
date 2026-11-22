import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { useLocation, useNavigate } from 'react-router';
import {
  CreateInviteMutation,
  DeleteAccountMutation,
  DeleteInviteMutation,
  EngineeringSettingsQuery,
  InvitesQuery,
  MeQuery,
} from '../graphql/operations';
import { showToast } from '../lib/celebrate';
import { formatDay } from '../lib/activities';
import { useTheme } from '../lib/preferences';
import type { Theme } from '../lib/theme';
import { useSignOut } from '../lib/useSignOut';
import {
  CopyIcon,
  FileTextIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  TrashIcon,
  UsersIcon,
} from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, PageHeader, buttonClasses } from '../components/ui';
import SaveToOnwardCard from '../components/SaveToOnwardCard';
import EngineeringSettings from '../components/settings/EngineeringSettings';

/** Appearance, the software engineering track, and your account, behind the gear in the header. */
export default function SettingsPage() {
  const { data } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });
  const me = data?.me;
  const [signOut, signingOut] = useSignOut();
  useScrollToHash();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" />
      {/* Fine rules between the big groups, so related settings read together. */}
      <div className="divide-y divide-line [&>*]:py-10 [&>*:first-child]:pt-0">
        <Appearance />

        <div id="engineering" className="scroll-mt-24">
          <EngineeringSettings />
        </div>

        <section aria-labelledby="account-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="account-heading" className="text-[22px]/7 font-semibold">
                Your account
              </h2>
              {me?.emailAddress && (
                <p className="mt-1 text-sm/5 break-all text-muted">{me.emailAddress}</p>
              )}
            </div>
            <Button variant="secondary" onClick={() => void signOut()} disabled={signingOut}>
              <LogOutIcon /> Sign out
            </Button>
          </div>
          <div id="save-to-onward" className="scroll-mt-24">
            <SaveToOnwardCard />
          </div>
          {me?.admin && <Invites />}
          <YourData />
          <DeleteAccount />
        </section>
      </div>
    </div>
  );
}

/**
 * Links like /settings#engineering open the page at that section. The router
 * doesn't do this itself. It waits for the engineering settings to load, since
 * the sections below them move down when they do.
 */
function useScrollToHash() {
  const { hash } = useLocation();
  const { data } = useQuery(EngineeringSettingsQuery);
  const loaded = Boolean(data);
  useEffect(() => {
    if (!hash || !loaded) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
  }, [hash, loaded]);
}

const THEMES: { value: Theme; label: string; Icon: (props: { className?: string }) => ReactNode }[] = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

function Appearance() {
  const [theme, setTheme] = useTheme();

  return (
    <section aria-labelledby="appearance-heading">
      <h2 id="appearance-heading" className="text-[22px]/7 font-semibold">
        Appearance
      </h2>
      <p className="mt-1 mb-5 text-muted">Light, dark, or whatever your computer uses. This browser remembers your pick.</p>
      <fieldset>
        <legend className="mb-2 text-sm/5 font-semibold">Theme</legend>
        {/* One control with three parts. The one you picked is filled in violet. */}
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-control bg-surface p-1 sm:inline-grid sm:min-w-96">
          {THEMES.map(({ value, label, Icon }) => (
            <label
              key={value}
              className={
                'flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm/5 font-medium transition ' +
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-link ' +
                (theme === value ? 'bg-action text-white' : 'text-muted hover:bg-stone-200/60 hover:text-ink dark:hover:bg-stone-800')
              }
            >
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => setTheme(value)}
                  className="sr-only"
                />
              <Icon className="text-lg" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function Invites() {
  const { data } = useQuery(InvitesQuery);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [createInvite, { loading }] = useMutation(CreateInviteMutation, { refetchQueries: ['Invites'] });
  const [deleteInvite] = useMutation(DeleteInviteMutation, { refetchQueries: ['Invites'] });

  const linkFor = (code: string) => `${window.location.origin}/signup?invite=${encodeURIComponent(code)}`;

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(linkFor(code));
      showToast('celebrate', 'Invite link copied', 'Send it to your friend. It works once.');
    } catch {
      showToast('gentle', "Couldn't copy", `Share this code instead: ${code}`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    const { data: result } = await createInvite({ variables: { note: note.trim() || null } });
    const created = result?.createInvite;
    if (created?.invite) {
      setNote('');
      void copy(created.invite.code);
    } else {
      setErrors(created?.errors.map((e) => e.message) ?? ['Something went wrong. Try again.']);
    }
  }

  const invites = data?.invites ?? [];

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-lg/6 font-semibold">
        <UsersIcon className="text-muted" /> Invite friends
      </h3>
      <p className="mt-1 mb-4 text-sm/5 text-muted">
        Each invite link works once. Everyone gets their own private account.
      </p>
      <ErrorBanner messages={errors} />
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <Field label="Who's it for? (optional)" htmlFor="invite-note" className="min-w-0 flex-1 basis-56">
          <Input id="invite-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sam" maxLength={100} />
        </Field>
        <Button type="submit" disabled={loading}>
          <PlusIcon /> Make an invite link
        </Button>
      </form>

      {invites.length > 0 && (
        <ul className="mt-4 divide-y divide-line">
          {invites.map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <code className="rounded-lg bg-stone-100 px-2 py-1 font-mono text-sm font-bold dark:bg-stone-800">{invite.code}</code>
              <span className="min-w-0 flex-1 text-sm">
                {invite.note && <span className="font-bold">{invite.note} · </span>}
                <span className="text-stone-500 dark:text-stone-400">
                  {invite.usedAt
                    ? `Used by ${invite.usedByEmail ?? 'a deleted account'} on ${formatDay(invite.usedAt.slice(0, 10))}`
                    : `Made ${formatDay(invite.createdAt.slice(0, 10))}, not used yet`}
                </span>
              </span>
              {!invite.usedAt && (
                <span className="flex gap-1">
                  <Button variant="ghost" className="text-sm" onClick={() => void copy(invite.code)}>
                    <CopyIcon /> Copy link
                  </Button>
                  <button
                    type="button"
                    aria-label={`Cancel invite ${invite.code}`}
                    title="Cancel this invite"
                    onClick={() => void deleteInvite({ variables: { id: invite.id } })}
                    className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  >
                    <TrashIcon />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function YourData() {
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-lg/6 font-semibold">
        <FileTextIcon className="text-muted" /> Your data
      </h3>
      <div className="mt-2 space-y-2 text-sm/5 text-muted">
        <p>
          Onward stores what you put in: your applications, contacts, resumes, activity, goals, prep, and study time, plus your
          email and a scrambled (hashed) version of your password. A GitHub token, if you add one, is encrypted.
        </p>
        <p>
          Your job hunt is private to your account. Nobody else using this Onward can see it. Whoever runs the server
          can technically reach the database, the same as with any website.
        </p>
        <p>LeetCode and GitHub are only contacted if you connect them, to read your public activity.</p>
      </div>
      <a href="/account/export" download className={buttonClasses('secondary', 'mt-4')}>
        Download my data
      </a>
      <p className="mt-2 text-[13px]/[18px] text-muted">One JSON file with everything, readable by any program.</p>
    </Card>
  );
}

function DeleteAccount() {
  const client = useApolloClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [deleteAccount, { loading }] = useMutation(DeleteAccountMutation);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data } = await deleteAccount({ variables: { password } });
    const result = data?.deleteAccount;
    if (result?.deleted) {
      await client.clearStore();
      navigate('/login', { replace: true });
    } else {
      setError(result?.errors[0]?.message ?? 'Something went wrong. Try again.');
    }
  }

  return (
    <Card className="border-rose-300! p-5 dark:border-rose-900!">
      <h3 className="flex items-center gap-2 text-lg/6 font-semibold">
        <TrashIcon className="text-rose-600 dark:text-rose-400" /> Delete my account
      </h3>
      <p className="mt-1 text-sm/5 text-muted">
        This deletes your account and everything in it, for good. Download your data first if you want a copy.
      </p>
      {!open ? (
        <Button variant="ghostDanger" className="mt-3 -ml-3" onClick={() => setOpen(true)}>
          Delete my account…
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3" noValidate>
          <Field label="Type your password to confirm" htmlFor="delete-password" error={error}>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="danger" disabled={loading || password === ''}>
              {loading ? 'Deleting…' : 'Delete everything'}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
