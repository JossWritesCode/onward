import { useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { NavLink, Outlet, useLocation } from 'react-router';
import { MeQuery, UpdateTimeZoneMutation } from '../graphql/operations';
import { useMuted } from '../lib/preferences';
import { playSound } from '../lib/sounds';
import { useSignOut } from '../lib/useSignOut';
import Logo from './Logo';
import StreakFlame from './StreakFlame';
import TimerPill from './prep/TimerPill';
import Toaster from './Toaster';
import { BoardIcon, BookIcon, CodeIcon, FileTextIcon, GearIcon, LogOutIcon, UsersIcon, VolumeIcon, VolumeOffIcon } from './icons';

const headerButton =
  'inline-flex items-center gap-1.5 rounded-xl px-1.5 py-2 text-sm font-semibold transition sm:px-2.5 ' +
  'text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 ' +
  'dark:text-night-300 dark:hover:bg-night-850 dark:hover:text-night-50 ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30';

// The page you're on gets a soft violet tint, so it stands out without shouting.
const activeNav = 'bg-brand-50 text-brand-700 dark:bg-brand-tint dark:text-brand-250';

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
    // Unmuting plays a little pop, so you know it worked.
    if (muted) setTimeout(() => playSound('pop'), 0);
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-stone-50/90 backdrop-blur dark:border-night-700/60 dark:bg-night-950/90">
        <div className="mx-auto flex max-w-350 items-center gap-0 px-3 min-[360px]:gap-0.5 py-3 sm:gap-2 sm:px-4">
          <NavLink to="/applications" aria-label="Onward home" className="mr-auto">
            <Logo compact />
          </NavLink>

          <TimerPill />
          <StreakFlame />

          <NavLink
            to="/applications"
            aria-current={onBoard ? 'page' : undefined}
            className={`${headerButton} ${onBoard ? activeNav : ''}`}
          >
            <BoardIcon className="text-lg" />
            <span className="hidden sm:inline">Board</span>
            <span className="sr-only sm:hidden">Board</span>
          </NavLink>

          <NavLink
            to="/prep"
            className={({ isActive }) =>
              `${headerButton} ${isActive ? activeNav : ''}`
            }
          >
            <BookIcon className="text-lg" />
            <span className="hidden sm:inline">Prep</span>
            <span className="sr-only sm:hidden">Interview prep</span>
          </NavLink>

          <NavLink
            to="/resumes"
            className={({ isActive }) =>
              `${headerButton} ${isActive ? activeNav : ''}`
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
            className={({ isActive }) =>
              `${headerButton} ${isActive ? activeNav : ''}`
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

          <NavLink
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className={({ isActive }) =>
              `${headerButton} ${isActive ? activeNav : ''}`
            }
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
