/**
 * Onward's mark: one gentle stroke rising up and to the right, like a line
 * drawn in a notebook, on a 24 by 24 grid. The header, the shared recap image
 * and public/favicon.svg all draw these same paths.
 */
const CURVE = 'c4.6-1.4 9-5.8 12.6-12.4';
const HEAD = 'M11.4 6.2h6.4v6.4';

export const ONWARD_MARK_PATHS: readonly string[] = [`M5 19${CURVE}`, HEAD];

/**
 * The mark with a flat rule leading into it from the left. The rule and the
 * rising line are one stroke, so they always meet cleanly. The rule starts
 * `length` units left of the mark, at x = 5 - length.
 */
export function onwardMarkWithRule(length: number): readonly string[] {
  return [`M${5 - length} 19H5${CURVE}`, HEAD];
}
