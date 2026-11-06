import { useState, type FormEvent } from 'react';
import { useApolloClient, useMutation } from '@apollo/client';
import { Link, useLocation, useNavigate } from 'react-router';
import { SignInMutation } from '../graphql/operations';
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
        <Field label="Password" htmlFor="password">
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
