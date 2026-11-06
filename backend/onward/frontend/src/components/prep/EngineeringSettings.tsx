import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { EngineeringSettingsQuery, UpdateEngineeringSettingsMutation } from '../../graphql/operations';
import { showToast } from '../../lib/celebrate';
import { fieldError, generalErrors, type UserError } from '../../lib/errors';
import { ExternalLinkIcon } from '../icons';
import { Button, Card, ErrorBanner, Field, Input } from '../ui';

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

/** Turns the software engineering track on and connects LeetCode and GitHub. */
export default function EngineeringSettings() {
  const { data } = useQuery(EngineeringSettingsQuery);
  const me = data?.me;
  if (!me) return null;
  return <SettingsForm key={me.id} me={me} />;
}

type Settings = {
  engineeringTrack?: boolean;
  leetcodeUsername?: string;
  githubUsername?: string;
  githubToken?: string;
};

type Me = {
  engineeringTrack: boolean;
  leetcodeUsername?: string | null;
  githubUsername?: string | null;
  githubConnected: boolean;
};

function SettingsForm({ me }: { me: Me }) {
  const [enabled, setEnabled] = useState(me.engineeringTrack);
  const [leetcode, setLeetcode] = useState(me.leetcodeUsername ?? '');
  const [github, setGithub] = useState(me.githubUsername ?? '');
  const [token, setToken] = useState('');
  const [errors, setErrors] = useState<UserError[]>([]);
  const [update, { loading }] = useMutation(UpdateEngineeringSettingsMutation, {
    refetchQueries: ['Me', 'Engineering', 'Streak'],
  });

  async function save(variables: Settings, title: string, body: string) {
    const { data } = await update({ variables });
    const result = data?.updateEngineeringSettings;
    if (result?.user) {
      setErrors([]);
      setToken('');
      showToast('celebrate', title, body);
    } else {
      setErrors(result?.errors ?? [{ message: 'Something went wrong. Try again.' }]);
    }
  }

  async function toggle(next: boolean) {
    setEnabled(next);
    await save(
      { engineeringTrack: next },
      next ? 'Engineering track on' : 'Engineering track off',
      next ? 'Add your accounts below, then find it as a tab on the Prep page.' : 'You can turn it back on anytime.',
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const variables: Settings = { leetcodeUsername: leetcode, githubUsername: github };
    if (token.trim()) variables.githubToken = token;
    await save(variables, 'Accounts saved', 'Your stats will show on the Engineering tab of Prep.');
  }

  return (
    <section aria-labelledby="engineering-heading">
      <h2 id="engineering-heading" className="text-xl font-black">
        Software engineering track
      </h2>
      <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
        Adds an Engineering tab to Prep with your LeetCode streak, GitHub contributions, and hours studied.
      </p>
      <Card className="space-y-5 p-5">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="font-bold">Show the Engineering tab</span>
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            disabled={loading}
            onChange={(e) => toggle(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative h-7 w-12 shrink-0 rounded-full bg-stone-300 transition peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/30 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5 dark:bg-stone-700"
          />
        </label>

        {enabled && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 border-t-2 border-stone-100 pt-5 dark:border-stone-800">
            <ErrorBanner messages={generalErrors(errors, ['leetcodeUsername', 'githubUsername', 'githubToken'])} />
            <Field
              label="LeetCode username"
              htmlFor="leetcode-username"
              hint="Your profile needs to be public. Days you submit on LeetCode count toward your Onward streak, starting today."
              error={fieldError(errors, 'leetcodeUsername')}
            >
              <Input id="leetcode-username" value={leetcode} onChange={(e) => setLeetcode(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="GitHub username" htmlFor="github-username" error={fieldError(errors, 'githubUsername')}>
              <Input id="github-username" value={github} onChange={(e) => setGithub(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="GitHub token" htmlFor="github-token" error={fieldError(errors, 'githubToken')}>
              <Input
                id="github-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={me.githubConnected ? 'Saved. Paste a new one to replace it.' : 'github_pat_…'}
                autoComplete="off"
              />
            </Field>
            <details className="rounded-xl bg-stone-100 px-4 py-3 text-sm dark:bg-stone-800/60">
              <summary className="cursor-pointer font-bold">How to make a GitHub token</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-stone-600 dark:text-stone-300">
                <li>
                  Open{' '}
                  <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-brand-600 hover:underline dark:text-brand-300">
                    GitHub's new token page <ExternalLinkIcon />
                  </a>
                  .
                </li>
                <li>Name it "Onward" and pick an expiration date.</li>
                <li>Leave repository access on "Public repositories" and don't add any permissions.</li>
                <li>Generate the token, copy it, and paste it above.</li>
              </ol>
              <p className="mt-2 text-stone-500 dark:text-stone-400">
                Onward only reads your contribution calendar, and the token is stored encrypted.
              </p>
            </details>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save accounts'}
              </Button>
              {me.githubConnected && (
                <Button variant="ghostDanger" onClick={() => save({ githubToken: '' }, 'GitHub token removed', 'Add a new one anytime.')} disabled={loading}>
                  Remove GitHub token
                </Button>
              )}
            </div>
          </form>
        )}
      </Card>
    </section>
  );
}
