import { useState, type FormEvent } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router';
import { CreateInviteMutation, DeleteAccountMutation, DeleteInviteMutation, InvitesQuery, MeQuery } from '../graphql/operations';
import { showToast } from '../lib/celebrate';
import { formatDay } from '../lib/activities';
import { CopyIcon, FileTextIcon, PlusIcon, TrashIcon, UsersIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, PageHeader } from '../components/ui';
import SaveToOnwardCard from '../components/SaveToOnwardCard';

export default function AccountPage() {
  const { data } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });
  const me = data?.me;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Your account" subtitle={me?.emailAddress} />
      <div className="space-y-5">
        <SaveToOnwardCard />
        {me?.admin && <Invites />}
        <YourData />
        <DeleteAccount />
      </div>
    </div>
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
      <h2 className="flex items-center gap-2 text-xl font-black">
        <UsersIcon className="text-brand-500" /> Invite friends
      </h2>
      <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
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
        <ul className="mt-4 divide-y-2 divide-stone-100 dark:divide-stone-800">
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
      <h2 className="flex items-center gap-2 text-xl font-black">
        <FileTextIcon className="text-brand-500" /> Your data
      </h2>
      <div className="mt-2 space-y-2 text-sm text-stone-600 dark:text-stone-300">
        <p>
          Onward stores what you put in: your applications, contacts, activity, goals, prep, and study time, plus your
          email and a scrambled (hashed) version of your password. A GitHub token, if you add one, is encrypted.
        </p>
        <p>
          Your job hunt is private to your account. Nobody else using this Onward can see it. Whoever runs the server
          can technically reach the database, the same as with any website.
        </p>
        <p>LeetCode and GitHub are only contacted if you connect them, to read your public activity.</p>
      </div>
      <a href="/account/export" download className="mt-4 inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 border-stone-200 bg-white px-5 py-2 font-extrabold text-brand-600 transition hover:bg-brand-50 active:translate-y-0.5 active:border-b-2 dark:border-stone-700 dark:bg-stone-900 dark:text-brand-300 dark:hover:bg-stone-800">
        Download my data
      </a>
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">One JSON file with everything, readable by any program.</p>
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
    <Card className="border-rose-200 p-5 dark:border-rose-900/60">
      <h2 className="flex items-center gap-2 text-xl font-black">
        <TrashIcon className="text-rose-500" /> Delete my account
      </h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
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
