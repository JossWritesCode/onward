import { useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { NavLink, Outlet, useLocation } from 'react-router';
import { MeQuery, UpdateTimeZoneMutation } from '../graphql/operations';
import { useMuted } from '../lib/preferences';
import { playSound } from '../lib/sounds';
import { useSignOut } from '../lib/useSignOut';
import Logo from './Logo';
import ProgressLink from './ProgressLink';
import TimerPill from './prep/TimerPill';
import Toaster from './Toaster';
import { BoardIcon, BookIcon, CodeIcon, FileTextIcon, GearIcon, LogOutIcon, UsersIcon, VolumeIcon, VolumeOffIcon } from './icons';

const headerButton =
  'relative inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1.5 py-2 text-sm/5 font-medium transition sm:px-2.5 ' +
  'text-muted hover:bg-stone-200/60 hover:text-ink dark:hover:bg-stone-800 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus';

const navClass = (isActive: boolean) => `${headerButton} ${isActive ? activeNav : ''}`;

// The page you're on gets ink-dark text and a short evergreen line under it.
const activeNav =
  'text-ink! after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:w-5 after:-translate-x-1/2 ' +
  'after:rounded-full after:bg-link';

export default function Layout() {
  // The board's own pages: applications, and the page that edits its columns.
  const { pathname } = useLocation();
  const onBoard = /^\/(applications|columns)(\/|$)/.test(pathname);
  const { data } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });
  const [signOut, signingOut] = useSignOut();
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

  function toggleSound() {
    setMuted(!muted);
    // Unmuting plays the soft note, so you know sound is back on.
    if (muted) setTimeout(() => playSound('note'), 0);
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-page">
        <div className="mx-auto flex max-w-350 items-center gap-0 px-3 min-[360px]:gap-0.5 py-3 sm:gap-2 sm:px-4">
          <NavLink to="/applications" aria-label="Onward home" className="mr-auto">
            <Logo compact />
          </NavLink>

          <TimerPill />

          <NavLink
            to="/applications"
            aria-current={onBoard ? 'page' : undefined}
            className={`${headerButton} ${onBoard ? activeNav : ''}`}
          >
            <BoardIcon className="text-lg" />
            <span className="hidden sm:inline">Board</span>
            <span className="sr-only sm:hidden">Board</span>
          </NavLink>

          <ProgressLink className={navClass} />

          <NavLink
            to="/prep"
            className={({ isActive }) => navClass(isActive)}
          >
            <BookIcon className="text-lg" />
            <span className="hidden sm:inline">Prep</span>
            <span className="sr-only sm:hidden">Interview prep</span>
          </NavLink>

          <NavLink
            to="/resumes"
            className={({ isActive }) => navClass(isActive)}
          >
            <FileTextIcon className="text-lg" />
            <span className="hidden sm:inline">Resumes</span>
            <span className="sr-only sm:hidden">Resumes</span>
          </NavLink>

          {data?.me?.engineeringTrack && (
            <NavLink
              to="/engineering"
              className={({ isActive }) =>
                `${headerButton} ${isActive ? activeNav : ''}`
              }
            >
              <CodeIcon className="text-lg" />
              <span className="hidden sm:inline">Engineering</span>
              <span className="sr-only sm:hidden">Engineering</span>
            </NavLink>
          )}

          <NavLink
            to="/contacts"
            className={({ isActive }) => navClass(isActive)}
          >
            <UsersIcon className="text-lg" />
            <span className="hidden sm:inline">Contacts</span>
            <span className="sr-only sm:hidden">Contacts</span>
          </NavLink>

          {/* A little room between where you can go and the settings for the app itself. */}
          <span aria-hidden="true" className="w-1 sm:w-3" />

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
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className={({ isActive }) => navClass(isActive)}
          >
            <GearIcon className="text-lg" />
          </NavLink>

          {/* Phones sign out from Settings, so the header has room for everything else. */}
          <div className="hidden sm:flex">
            <button type="button" onClick={() => void signOut()} disabled={signingOut} className={headerButton}>
              <LogOutIcon className="text-lg" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-350 px-4 pt-6 pb-16">
        <Outlet />
      </main>

      <Toaster />
    </div>
  );
}
