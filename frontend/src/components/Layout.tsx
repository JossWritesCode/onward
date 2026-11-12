import { useEffect, useRef, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { MeQuery, SignOutMutation, UpdateTimeZoneMutation } from '../graphql/operations';
import { useMuted } from '../lib/preferences';
import { playSound } from '../lib/sounds';
import Logo from './Logo';
import StreakFlame from './StreakFlame';
import TimerPill from './prep/TimerPill';
import Toaster from './Toaster';
import { BoardIcon, BookIcon, CodeIcon, DotsIcon, FileTextIcon, LogOutIcon, UserIcon, UsersIcon, VolumeIcon, VolumeOffIcon } from './icons';

const headerButton =
  'inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-extrabold transition sm:px-2.5 ' +
  'text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 ' +
  'dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30';

export default function Layout() {
  const client = useApolloClient();
  const navigate = useNavigate();
  // The board's own pages: applications, and the page that edits its columns.
  const { pathname } = useLocation();
  const onBoard = /^\/(applications|columns)(\/|$)/.test(pathname);
  const { data } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });
  const [signOut, { loading: signingOut }] = useMutation(SignOutMutation);
  const [muted, setMuted] = useMuted();
  const [updateTimeZone] = useMutation(UpdateTimeZoneMutation, { refetchQueries: ['Streak', 'Progress'] });

  // Days and streaks follow your own clock, so keep the server's copy of your time zone current.
  const savedTimeZone = data?.me?.timeZone;
  useEffect(() => {
    if (!savedTimeZone) return;
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTimeZone && browserTimeZone !== savedTimeZone) {
      void updateTimeZone({ variables: { timeZone: browserTimeZone } }).catch(() => {});
    }
  }, [savedTimeZone, updateTimeZone]);

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
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-4 py-3 sm:gap-2">
          <NavLink to="/applications" aria-label="Onward home" className="mr-auto">
            <Logo compact />
          </NavLink>

          <TimerPill />
          <StreakFlame />

          <NavLink
            to="/applications"
            aria-current={onBoard ? 'page' : undefined}
            className={`${headerButton} ${onBoard ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200' : ''}`}
          >
            <BoardIcon className="text-lg" />
            <span className="hidden sm:inline">Board</span>
            <span className="sr-only sm:hidden">Board</span>
          </NavLink>

          <NavLink
            to="/prep"
            className={({ isActive }) =>
              `${headerButton} ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200' : ''}`
            }
          >
            <BookIcon className="text-lg" />
            <span className="hidden sm:inline">Prep</span>
            <span className="sr-only sm:hidden">Interview prep</span>
          </NavLink>

          <NavLink
            to="/resumes"
            className={({ isActive }) =>
              `${headerButton} ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200' : ''}`
            }
          >
            <FileTextIcon className="text-lg" />
            <span className="hidden sm:inline">Resumes</span>
            <span className="sr-only sm:hidden">Resumes</span>
          </NavLink>

          {data?.me?.engineeringTrack && (
            <NavLink
              to="/engineering"
              className={({ isActive }) =>
                `${headerButton} ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200' : ''}`
              }
            >
              <CodeIcon className="text-lg" />
              <span className="hidden sm:inline">Engineering</span>
              <span className="sr-only sm:hidden">Engineering</span>
            </NavLink>
          )}

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

          {/* Computers: sound and sign out sit in the header. */}
          <div className="hidden items-center gap-2 sm:flex">
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

            <NavLink
              to="/account"
              title="Your account"
              className={({ isActive }) =>
                `${headerButton} ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200' : ''}`
              }
            >
              <UserIcon className="text-lg" />
              <span className="hidden font-semibold lg:inline">{data?.me?.emailAddress}</span>
              <span className="sr-only lg:hidden">Your account</span>
            </NavLink>

            <button type="button" onClick={handleSignOut} disabled={signingOut} className={headerButton}>
              <LogOutIcon className="text-lg" />
              Sign out
            </button>
          </div>

          {/* Phones: they move into a menu, so the header has room for everything else. */}
          <MoreMenu muted={muted} onToggleSound={toggleSound} onSignOut={handleSignOut} />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pt-6 pb-16">
        <Outlet />
      </main>

      <Toaster />
    </div>
  );
}

function MoreMenu({
  muted,
  onToggleSound,
  onSignOut,
}: {
  muted: boolean;
  onToggleSound: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const item =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-bold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800';

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        aria-label="More"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={headerButton}
      >
        <DotsIcon className="text-lg" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-2 w-48 rounded-2xl border-2 border-stone-200 bg-white p-1.5 shadow-lg dark:border-stone-700 dark:bg-stone-900">
          <button
            type="button"
            className={item}
            onClick={() => {
              onToggleSound();
              setOpen(false);
            }}
          >
            {muted ? <VolumeIcon /> : <VolumeOffIcon />}
            {muted ? 'Turn sounds on' : 'Turn sounds off'}
          </button>
          <NavLink to="/account" className={item} onClick={() => setOpen(false)}>
            <UserIcon /> Your account
          </NavLink>
          <button
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOutIcon /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
