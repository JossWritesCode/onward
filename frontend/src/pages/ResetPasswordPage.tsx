import { useState, type FormEvent } from 'react';
import { useApolloClient, useMutation } from '@apollo/client';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ResetPasswordMutation } from '../graphql/operations';
import { fieldError, generalErrors, type UserError } from '../lib/errors';
import { Button, ErrorBanner, Field, Input } from '../components/ui';
import AuthLayout from './AuthLayout';

const FIELDS = ['password', 'passwordConfirmation'];

/** Where the emailed reset link lands: /reset-password?token=… */
export default function ResetPasswordPage() {
  const client = useApolloClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<UserError[]>([]);
  const [reset, { loading }] = useMutation(ResetPasswordMutation);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const { data } = await reset({ variables: { token, password, passwordConfirmation } });
      const result = data?.resetPassword;
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

  const expired = fieldError(errors, 'token');

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Then you're right back to it."
      footer={
        <Link to="/login" className="font-extrabold text-brand-600 hover:underline dark:text-brand-300">
          Back to sign in
        </Link>
      }
    >
      {!token || expired ? (
        <div className="space-y-4">
          <ErrorBanner messages={[expired ?? "This link is missing its code. Use the link from the email exactly as it arrived."]} />
          <Link to="/forgot-password" className="font-extrabold text-brand-600 hover:underline dark:text-brand-300">
            Send a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <ErrorBanner messages={generalErrors(errors, FIELDS)} />
          <Field label="New password" htmlFor="password" hint="At least 8 characters." error={fieldError(errors, 'password')}>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Confirm new password" htmlFor="password-confirmation" error={fieldError(errors, 'passwordConfirmation')}>
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
            {loading ? 'Saving…' : 'Save and sign in'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
