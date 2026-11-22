import { useQuery } from '@apollo/client';
import { NavLink } from 'react-router';
import { MeQuery } from '../../graphql/operations';

/** "Behavioral" and "Engineering" tabs, shown when the software engineering track is on. */
export default function PrepTabs() {
  const { data } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });
  if (!data?.me?.engineeringTrack) return null;

  const tab = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-4 py-1.5 text-sm/5 font-medium transition ${
      isActive ? 'bg-action text-white' : 'text-muted hover:bg-stone-200/60 hover:text-ink dark:hover:bg-stone-800'
    }`;

  return (
    <nav
      aria-label="Prep sections"
      className="mb-6 inline-flex rounded-lg border border-line bg-surface p-1"
    >
      <NavLink to="/prep" end className={tab}>
        Behavioral
      </NavLink>
      <NavLink to="/prep/engineering" className={tab}>
        Engineering
      </NavLink>
    </nav>
  );
}
