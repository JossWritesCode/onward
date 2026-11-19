// Light or dark. "System" follows the computer's own setting and is what you
// get until you pick. The choice is remembered in this browser, under the same
// key the little script in index.html reads, so the right colors show before
// the app loads and there's no flash of the wrong ones.

export type Theme = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

export const THEME_KEY = 'onward:theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Anything that isn't a choice you can make, including nothing saved, means "system". */
export function parseTheme(stored: string | null | undefined): Theme {
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function resolveScheme(theme: Theme, systemDark: boolean): Scheme {
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

/** Tailwind's dark: styles and the browser's own controls both follow this. */
export function applyScheme(scheme: Scheme, root: HTMLElement = document.documentElement) {
  root.dataset.theme = scheme;
  root.style.colorScheme = scheme;
}
