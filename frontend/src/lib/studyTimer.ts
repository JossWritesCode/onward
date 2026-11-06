import { useEffect, useState, useSyncExternalStore } from 'react';

// The study timer lives outside any one page, so it keeps running while you
// move around the app. It's saved in this browser, so a reload doesn't lose it.

export type RunningTimer = { topic: string; minutes: number; startedAt: number };

const KEY = 'onward:study-timer';
const listeners = new Set<() => void>();

function load(): RunningTimer | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RunningTimer;
    return typeof parsed.startedAt === 'number' && typeof parsed.minutes === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

let current: RunningTimer | null = typeof window === 'undefined' ? null : load();

function save(next: RunningTimer | null) {
  current = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Still works until the page reloads.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function startTimer(topic: string, minutes: number) {
  save({ topic: topic.trim() || 'Studying', minutes, startedAt: Date.now() });
}

/** Stops the timer and returns how many whole minutes it ran. */
export function stopTimer(): { topic: string; minutes: number } | null {
  const running = current;
  if (!running) return null;
  save(null);
  const elapsed = Math.floor((Date.now() - running.startedAt) / 60_000);
  return { topic: running.topic, minutes: Math.min(elapsed, running.minutes) };
}

/** The running timer (if any), ticking once a second. */
export function useStudyTimer() {
  const running = useSyncExternalStore(subscribe, () => current);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  if (!running) return { running: null, remainingMs: 0, elapsedMs: 0 };
  const elapsedMs = Math.max(0, now - running.startedAt);
  return { running, elapsedMs, remainingMs: Math.max(0, running.minutes * 60_000 - elapsedMs) };
}

export function formatClock(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}
