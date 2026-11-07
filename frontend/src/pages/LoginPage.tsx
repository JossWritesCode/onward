import { useState, type FormEvent } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { Link, useLocation, useNavigate } from 'react-router';
import { ServerSettingsQuery, SignInMutation } from '../graphql/operations';
import { generalErrors, type UserError } from '../lib/errors';
import { Button, ErrorBanner, Field, Input } from '../components/ui';
import AuthLayout from './AuthLayout';

export default function LoginPage() {
  const client = useApolloClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<UserError[]>([]);
  const [signIn, { loading }] = useMutation(SignInMutation);
  const { data: settings } = useQuery(ServerSettingsQuery);
  const passwordReset = (location.state as { passwordReset?: boolean } | null)?.passwordReset;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const { data } = await signIn({ variables: { emailAddress, password } });
      const result = data?.signIn;
      if (result?.user) {
        await client.resetStore();
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from && from !== '/login' ? from : '/applications', { replace: true });
      } else {
        setErrors(result?.errors ?? []);
      }
    } catch (error) {
      setErrors([{ message: error instanceof Error ? error.message : 'Something went wrong. Try again.' }]);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Every step counts. Let's keep going."
      footer={
        <>
          New to Onward?{' '}
          <Link to="/signup" className="font-extrabold text-brand-600 hover:underline dark:text-brand-300">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorBanner messages={generalErrors(errors, [])} />
        {passwordReset && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            Check your email for a link to choose a new password.
          </p>
        )}
        <Field label="Email" htmlFor="email">
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
          hint={
            settings?.serverSettings.passwordResetAvailable ? (
              <Link to="/forgot-password" className="font-bold text-brand-600 hover:underline dark:text-brand-300">
                Forgot your password?
              </Link>
            ) : undefined
          }
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
