import { useId } from 'react';

// A leaf on a 24 by 12 grid, pointing right from its stem end at 0,0.
const LEAF = 'M0 0C5-5.5 15-6 23-.5 15 5 5 5 0 0Z';

// Where each leaf sits along the stem, how it turns, and how big it is.
const LEAVES = [
  { x: 139, y: 92, turn: -150, size: 0.9 },
  { x: 140, y: 80, turn: -30, size: 1 },
  { x: 136, y: 66, turn: -160, size: 1 },
  { x: 136, y: 54, turn: -40, size: 0.95 },
  { x: 131, y: 41, turn: -165, size: 0.85 },
  { x: 130, y: 31, turn: -55, size: 0.8 },
  { x: 125, y: 21, turn: -110, size: 0.7 },
];

/**
 * A small ink-and-wash drawing: a sprig leaning over a stack of contact
 * cards. The wash is a soft sage, a little out of line with the ink like real
 * watercolor, and both follow the light or dark theme.
 */
export default function SprigAndCards({ className = '' }: { className?: string }) {
  // A slightly rough edge for the wash, so it reads as paint rather than a flat shape.
  const filter = `wash-${useId().replace(/:/g, '')}`;

  return (
    <svg
      viewBox="0 0 180 120"
      width="180"
      height="120"
      fill="none"
      aria-hidden="true"
      className={`text-ink ${className}`}
    >
      <defs>
        <filter id={filter} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
      </defs>

      {/* Washes first, under the ink. */}
      <g filter={`url(#${filter})`}>
        <rect x="22" y="38" width="96" height="62" rx="6" transform="rotate(-3 70 69)" className="fill-brand-200 dark:fill-brand-700" opacity="0.55" />
        {LEAVES.map((leaf) => (
          <path
            key={`wash-${leaf.x}-${leaf.y}`}
            d={LEAF}
            transform={`translate(${leaf.x + 1.5} ${leaf.y + 1.5}) rotate(${leaf.turn}) scale(${leaf.size})`}
            className="fill-brand-300 dark:fill-brand-500"
            opacity="0.7"
          />
        ))}
      </g>

      {/* The cards: two behind, one in front with a name and a few lines. */}
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <rect x="26" y="24" width="88" height="56" rx="5" transform="rotate(-9 70 52)" className="fill-surface" strokeWidth="1.1" />
        <rect x="30" y="32" width="88" height="56" rx="5" transform="rotate(-4 74 60)" className="fill-surface" strokeWidth="1.1" />
        <rect x="34" y="42" width="88" height="56" rx="5" transform="rotate(2 78 70)" className="fill-surface" strokeWidth="1.3" />
        <g transform="rotate(2 78 70)">
          <circle cx="50" cy="60" r="7" strokeWidth="1.2" />
          <path d="M44.5 64.5c1.5-2.6 3.3-3.6 5.5-3.6s4 1 5.5 3.6" strokeWidth="1.1" />
          <path d="M63 56.5h34" strokeWidth="1.6" />
          <path d="M63 63.5h22" strokeWidth="1.1" opacity="0.7" />
          <path d="M44 78h62M44 85h44" strokeWidth="1.1" opacity="0.55" />
        </g>
      </g>

      {/* The sprig, drawn over the cards in a single ink line with its leaves. */}
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <path d="M146 112c-4-14-6-30-8-46-1.5-14-5-30-14-46" strokeWidth="1.3" />
        {LEAVES.map((leaf) => (
          <g key={`ink-${leaf.x}-${leaf.y}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.turn}) scale(${leaf.size})`}>
            <path d={LEAF} strokeWidth="1" />
            <path d="M1.5 0h15" strokeWidth="0.7" opacity="0.6" />
          </g>
        ))}
      </g>
    </svg>
  );
}
