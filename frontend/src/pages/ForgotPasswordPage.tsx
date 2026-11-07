import { useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router';
import { RequestPasswordResetMutation } from '../graphql/operations';
import { Button, ErrorBanner, Field, Input } from '../components/ui';
import AuthLayout from './AuthLayout';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [emailAddress, setEmailAddress] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [request, { loading }] = useMutation(RequestPasswordResetMutation);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const { data } = await request({ variables: { emailAddress } });
      const result = data?.requestPasswordReset;
      if (result?.sent) navigate('/login', { replace: true, state: { passwordReset: true } });
      else setErrors(result?.errors.map((error) => error.message) ?? ['Something went wrong. Try again.']);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Something went wrong. Try again.']);
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="It happens. We'll email you a link to choose a new one."
      footer={
        <Link to="/login" className="font-extrabold text-brand-600 hover:underline dark:text-brand-300">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorBanner messages={errors} />
        <Field label="Email" htmlFor="email" hint="If there's an account with this email, the link arrives in a minute or two.">
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
        <Button type="submit" className="w-full" disabled={loading || emailAddress.trim() === ''}>
          {loading ? 'Sending…' : 'Email me a link'}
        </Button>
      </form>
    </AuthLayout>
  );
}
