import { useId } from 'react';

// A leaf on a 24 by 12 grid, pointing right from its stem end at 0,0. The
// same leaf as in SprigAndCards, so the two drawings look like one hand.
const LEAF = 'M0 0C5-5.5 15-6 23-.5 15 5 5 5 0 0Z';

const LEAVES = [
  { x: 37, y: 104, turn: -20, size: 0.95 },
  { x: 35, y: 90, turn: -165, size: 0.9 },
  { x: 35, y: 74, turn: -35, size: 0.9 },
  { x: 33, y: 60, turn: -155, size: 0.8 },
  { x: 32, y: 46, turn: -50, size: 0.75 },
  { x: 29, y: 33, turn: -140, size: 0.65 },
  { x: 26, y: 20, turn: -95, size: 0.55 },
];

/**
 * A single sprig in ink and a soft sage wash, for a page margin. It's only
 * decoration, so screen readers skip it.
 */
export default function Sprig({ className = '' }: { className?: string }) {
  const filter = `sprig-wash-${useId().replace(/:/g, '')}`;

  return (
    <svg viewBox="0 0 70 130" width="70" height="130" fill="none" aria-hidden="true" className={`text-ink ${className}`}>
      <defs>
        <filter id={filter} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
      </defs>

      {/* The wash, a little out of line with the ink, like real watercolor. */}
      <g filter={`url(#${filter})`}>
        {LEAVES.map((leaf) => (
          <path
            key={`wash-${leaf.y}`}
            d={LEAF}
            transform={`translate(${leaf.x + 1.5} ${leaf.y + 1.5}) rotate(${leaf.turn}) scale(${leaf.size})`}
            className="fill-brand-300 dark:fill-brand-500"
            opacity="0.7"
          />
        ))}
      </g>

      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
        <path d="M40 126c-1-16-2-34-4-50-2-20-4-38-12-60" strokeWidth="1.3" />
        {LEAVES.map((leaf) => (
          <g key={`ink-${leaf.y}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.turn}) scale(${leaf.size})`}>
            <path d={LEAF} strokeWidth="1" />
            <path d="M1.5 0h15" strokeWidth="0.7" opacity="0.6" />
          </g>
        ))}
      </g>
    </svg>
  );
}
