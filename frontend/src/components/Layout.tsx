import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { MeQuery, SignOutMutation } from '../graphql/operations';
import { useMuted } from '../lib/preferences';
import { playSound } from '../lib/sounds';
import Logo from './Logo';
import Toaster from './Toaster';
import { LogOutIcon, UsersIcon, VolumeIcon, VolumeOffIcon } from './icons';

const headerButton =
  'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-extrabold transition ' +
  'text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 ' +
  'dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30';

export default function Layout() {
  const client = useApolloClient();
  const navigate = useNavigate();
  const { data } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });
  const [signOut, { loading: signingOut }] = useMutation(SignOutMutation);
  const [muted, setMuted] = useMuted();

  async function handleSignOut() {
    await signOut();
    await client.clearStore();
    navigate('/login', { replace: true });
  }

  function toggleSound() {
    setMuted(!muted);
    // Unmuting plays a little pop, so you know it worked.
    if (muted) setTimeout(() => playSound('pop'), 0);
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b-2 border-stone-200 bg-stone-50/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-3">
          <NavLink to="/applications" aria-label="Onward home" className="mr-auto">
            <Logo />
          </NavLink>

          <NavLink
            to="/contacts"
            className={({ isActive }) =>
              `${headerButton} ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200' : ''}`
            }
          >
            <UsersIcon className="text-lg" />
            <span className="hidden sm:inline">Contacts</span>
            <span className="sr-only sm:hidden">Contacts</span>
          </NavLink>

          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={!muted}
            aria-label={muted ? 'Turn sounds on' : 'Turn sounds off'}
            title={muted ? 'Sounds off' : 'Sounds on'}
            className={headerButton}
          >
            {muted ? <VolumeOffIcon className="text-lg" /> : <VolumeIcon className="text-lg" />}
          </button>

          <span className="hidden px-1 text-sm text-stone-500 lg:inline dark:text-stone-400">{data?.me?.emailAddress}</span>

          <button type="button" onClick={handleSignOut} disabled={signingOut} className={headerButton}>
            <LogOutIcon className="text-lg" />
            <span className="hidden sm:inline">Sign out</span>
            <span className="sr-only sm:hidden">Sign out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pt-6 pb-16">
        <Outlet />
      </main>

      <Toaster />
    </div>
  );
}
