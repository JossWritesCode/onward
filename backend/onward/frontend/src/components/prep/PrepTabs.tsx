import { useQuery } from '@apollo/client';
import { NavLink } from 'react-router';
import { MeQuery } from '../../graphql/operations';

/** "Behavioral" and "Engineering" tabs, shown when the software engineering track is on. */
export default function PrepTabs() {
  const { data } = useQuery(MeQuery, { fetchPolicy: 'cache-first' });
  if (!data?.me?.engineeringTrack) return null;

  const tab = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-4 py-1.5 text-sm font-extrabold transition ${
      isActive
        ? 'bg-brand-500 text-white'
        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
    }`;

  return (
    <nav
      aria-label="Prep sections"
      className="mb-6 inline-flex rounded-xl border-2 border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-900"
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
