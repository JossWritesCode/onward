import { OnwardMarkIcon } from './icons';

/**
 * The Onward wordmark: a small evergreen mark and the name set in Spectral,
 * like a title on a notebook cover. With `compact`, phones show just the mark
 * so the header has room for everything else.
 */
export default function Logo({ size = 'md', compact = false }: { size?: 'md' | 'lg'; compact?: boolean }) {
  const large = size === 'lg';
  return (
    <span className="inline-flex items-center gap-1.5">
      <OnwardMarkIcon className={`shrink-0 text-link ${large ? 'text-[34px]' : 'text-[28px]'}`} strokeWidth={2} />
      <span
        className={`font-brand font-semibold tracking-[-0.01em] text-ink ${large ? 'text-[34px]/none' : 'text-[26px]/none'} ${compact ? 'hidden sm:inline' : ''}`}
      >
        Onward
      </span>
    </span>
  );
}
