import type { ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { Navigate, Outlet, useLocation } from 'react-router';
import { MeQuery } from '../graphql/operations';
import { ErrorBanner, Spinner } from './ui';

/** Shows its routes only to signed-in people; everyone else goes to the login page. */
export function RequireAuth() {
  const location = useLocation();
  const { data, loading, error } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });

  if (loading && !data) return <Spinner />;
  if (error) return <ServerProblem message={error.message} />;
  // Keep the whole address, including a job from the "Save to Onward" bookmark.
  if (!data?.me) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }

  return <Outlet />;
}

/** Sends signed-in people past the login and sign-up pages. */
export function RedirectIfSignedIn() {
  const { data, loading, error } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });

  if (loading && !data) return <Spinner />;
  if (error) return <ServerProblem message={error.message} />;
  if (data?.me) return <Navigate to="/applications" replace />;

  return <Outlet />;
}

/**
 * The front page. Visitors see the landing page, and signed-in people go
 * straight to their board. Until we know which, it shows the spinner, so
 * someone who's signed in never sees the landing page flash by.
 */
export function PublicHome({ children }: { children: ReactNode }) {
  const { data, loading } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });

  if (loading && !data) return <Spinner />;
  if (data?.me) return <Navigate to="/applications" replace />;

  // Signed out, or the server couldn't say. The landing page doesn't need it,
  // so it still shows, and the sign-in page explains any problem itself.
  return children;
}

function ServerProblem({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <ErrorBanner
        messages={[
          "Couldn't reach the Onward server. Wait a moment and reload. If you're running Onward on your own computer, make sure bin/rails server is running.",
          message,
        ]}
      />
    </div>
  );
}
