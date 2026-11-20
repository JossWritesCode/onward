import { useApolloClient, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router';
import { SignOutMutation } from '../graphql/operations';

/** Signs out, forgets everything loaded for this account, and goes to the sign-in page. */
export function useSignOut(): [() => Promise<void>, boolean] {
  const client = useApolloClient();
  const navigate = useNavigate();
  const [signOut, { loading }] = useMutation(SignOutMutation);

  async function handleSignOut() {
    await signOut();
    await client.clearStore();
    navigate('/login', { replace: true });
  }

  return [handleSignOut, loading];
}
