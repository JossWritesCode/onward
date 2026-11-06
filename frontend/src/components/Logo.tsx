import { ArrowUpRightIcon } from './icons';

/** With `compact`, phones show just the icon so the header has room for everything else. */
export default function Logo({ size = 'md', compact = false }: { size?: 'md' | 'lg'; compact?: boolean }) {
  const large = size === 'lg';
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`flex items-center justify-center rounded-xl bg-brand-500 text-white ${
          large ? 'size-11 text-2xl' : 'size-9 text-xl'
        }`}
      >
        <ArrowUpRightIcon strokeWidth={3} />
      </span>
      <span
        className={`font-black tracking-tight text-brand-600 dark:text-brand-300 ${large ? 'text-3xl' : 'text-2xl'} ${compact ? 'hidden sm:inline' : ''}`}
      >
        Onward
      </span>
    </span>
  );
}
