import { useSyncExternalStore } from 'react';

// Small settings remembered in this browser. Storage can be unavailable
// (private windows, blocked site data), so every read and write is guarded.

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Not saved, but the setting still applies until the page reloads.
  }
}

/** A string setting that React components can read and update. */
function createSetting(key: string) {
  let value = read(key);
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set(next: string | null) {
      value = next;
      write(key, next);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const mutedSetting = createSetting('onward:muted');
const viewSetting = createSetting('onward:view');
const quoteHiddenSetting = createSetting('onward:quote-hidden-on');

export function isMuted() {
  return mutedSetting.get() === 'true';
}

export function useMuted(): [boolean, (muted: boolean) => void] {
  const muted = useSyncExternalStore(mutedSetting.subscribe, () => mutedSetting.get() === 'true');
  return [muted, (next) => mutedSetting.set(next ? 'true' : null)];
}

export type View = 'board' | 'list';

/** Board or list. Until you pick one, computers get the board and phones get the list. */
export function useView(): [View, (view: View) => void] {
  const stored = useSyncExternalStore(viewSetting.subscribe, viewSetting.get);
  const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  const view: View = stored === 'board' || stored === 'list' ? stored : wide ? 'board' : 'list';
  return [view, (next) => viewSetting.set(next)];
}

/** Hiding the daily quote lasts until tomorrow, when there's a new one. */
export function useQuoteHidden(today: string): [boolean, (hidden: boolean) => void] {
  const hiddenOn = useSyncExternalStore(quoteHiddenSetting.subscribe, quoteHiddenSetting.get);
  return [hiddenOn === today, (hidden) => quoteHiddenSetting.set(hidden ? today : null)];
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
