import type { ReactNode } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { MeQuery, SignOutMutation } from '../graphql/operations';
import Logo from './Logo';
import { BriefcaseIcon, LogOutIcon, UsersIcon } from './icons';
import { Button } from './ui';

const navItems = [
  { to: '/applications', label: 'Applications', icon: <BriefcaseIcon /> },
  { to: '/contacts', label: 'Contacts', icon: <UsersIcon /> },
];

export default function Layout() {
  const client = useApolloClient();
  const navigate = useNavigate();
  const { data } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });
  const [signOut, { loading: signingOut }] = useMutation(SignOutMutation);

  async function handleSignOut() {
    await signOut();
    await client.clearStore();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b-2 border-stone-200 bg-stone-50/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <NavLink to="/applications" aria-label="Onward home">
            <Logo />
          </NavLink>

          <nav className="hidden flex-1 items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-stone-500 md:inline dark:text-stone-400">{data?.me?.emailAddress}</span>
            <Button variant="ghost" onClick={handleSignOut} disabled={signingOut}>
              <LogOutIcon />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sr-only sm:hidden">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 pb-28 sm:pb-12">
        <Outlet />
      </main>

      {/* On phones, the main navigation sits at the bottom where thumbs can reach it. */}
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-2 gap-2 border-t-2 border-stone-200 bg-stone-50/95 p-2 backdrop-blur sm:hidden dark:border-stone-800 dark:bg-stone-950/95">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} stacked />
        ))}
      </nav>
    </div>
  );
}

function NavItem({ to, label, icon, stacked }: { to: string; label: string; icon: ReactNode; stacked?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-extrabold transition ${
          stacked ? 'flex-col gap-0.5 text-sm' : ''
        } ${
          isActive
            ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200'
            : 'text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
        }`
      }
    >
      <span className="text-xl">{icon}</span>
      {label}
    </NavLink>
  );
}
