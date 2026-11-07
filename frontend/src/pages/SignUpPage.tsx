import { useState, type FormEvent } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ServerSettingsQuery, SignUpMutation } from '../graphql/operations';
import { fieldError, generalErrors, type UserError } from '../lib/errors';
import { Button, ErrorBanner, Field, Input } from '../components/ui';
import AuthLayout from './AuthLayout';

const FIELDS = ['emailAddress', 'password', 'passwordConfirmation', 'inviteCode'];

export default function SignUpPage() {
  const client = useApolloClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: settings } = useQuery(ServerSettingsQuery);
  const inviteOnly = settings?.serverSettings.signups === 'INVITE';
  // Invite links look like /signup?invite=ABCD-EFGH.
  const [inviteCode, setInviteCode] = useState(searchParams.get('invite') ?? '');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<UserError[]>([]);
  const [signUp, { loading }] = useMutation(SignUpMutation);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const { data } = await signUp({
        variables: { emailAddress, password, passwordConfirmation, inviteCode: inviteCode.trim() || null },
      });
      const result = data?.signUp;
      if (result?.user) {
        await client.resetStore();
        navigate('/applications', { replace: true });
      } else {
        setErrors(result?.errors ?? []);
      }
    } catch (error) {
      setErrors([{ message: error instanceof Error ? error.message : 'Something went wrong. Try again.' }]);
    }
  }

  return (
    <AuthLayout
      title="Start your job hunt"
      subtitle="Track every application and celebrate every step."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-extrabold text-brand-600 hover:underline dark:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorBanner messages={generalErrors(errors, FIELDS)} />
        {(inviteOnly || inviteCode) && (
          <Field
            label="Invite code"
            htmlFor="invite-code"
            hint="Onward is invite-only here. Ask the person who runs it for a code."
            error={fieldError(errors, 'inviteCode')}
          >
            <Input
              id="invite-code"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="ABCD-EFGH"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </Field>
        )}
        <Field label="Email" htmlFor="email" error={fieldError(errors, 'emailAddress')}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            required
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters."
          error={fieldError(errors, 'password')}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field
          label="Confirm password"
          htmlFor="password-confirmation"
          error={fieldError(errors, 'passwordConfirmation')}
        >
          <Input
            id="password-confirmation"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating your account…' : 'Create account'}
        </Button>
        <p className="text-center text-xs text-stone-500 dark:text-stone-400">
          Your job hunt stays private to your account. You can download or delete everything anytime.
        </p>
      </form>
    </AuthLayout>
  );
}
