import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The accounts in backend/db/seeds/e2e.rb. Each spec file signs in as its
 * own, so files running side by side never move each other's cards.
 */
export type Account =
  | 'auth'
  | 'applications'
  | 'board'
  | 'columns'
  | 'resume-preview'
  | 'resume-import'
  | 'log-win'
  | 'follow-up'
  | 'interview-prep';

export const PASSWORD = 'password123';
export const emailFor = (account: Account) => `${account}@e2e.onward.test`;

export async function signIn(page: Page, account: Account) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(emailFor(account));
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await waitForBoard(page);
}

/**
 * Waits until the board's columns are on screen. The page heading shows
 * first, while the board is still loading, so it isn't enough to wait for.
 */
export async function waitForBoard(page: Page) {
  await expect(page.getByRole('heading', { name: 'Your job hunt' })).toBeVisible();
  await expect(page.locator('section[data-stage-id]').first()).toBeVisible();
}

/** A column on the board, by its name. */
export const column = (page: Page, name: string) => page.locator(`section[data-stage-id][aria-label="${name}"]`);

/** A card on the board, by its company. */
export const card = (page: Page, company: string) =>
  page.locator('[data-card-id]', { has: page.getByText(company, { exact: true }) });

/** The board's columns, left to right. */
export const columnOrder = (page: Page) =>
  page.locator('section[data-stage-id]').evaluateAll((sections) => sections.map((section) => section.getAttribute('aria-label')));

/**
 * Drags with a mouse, the way a person does: press, nudge past the 5px
 * threshold, glide to the target in steps, let go. Playwright's dragTo jumps
 * straight there, which the board's hand-built drag doesn't see as a drag.
 */
export async function drag(page: Page, from: Locator, to: { x: number; y: number }, { release = true } = {}) {
  const box = await from.boundingBox();
  if (!box) throw new Error('Nothing to drag from');
  const start = { x: box.x + Math.min(box.width / 2, 30), y: box.y + Math.min(box.height / 2, 20) };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 12, start.y + 8, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 15 });
  if (release) await page.mouse.up();
}

/** A point inside a locator, as fractions of its width and height. */
export async function pointIn(locator: Locator, fx = 0.5, fy = 0.5) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Not on screen');
  return { x: box.x + box.width * fx, y: box.y + box.height * fy };
}

/** Today's date on the accounts' clock (they're all in Toronto), as YYYY-MM-DD. */
export function todayInToronto(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** A date the way the app shows it on a card, like "Nov 21". */
export function shortDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/**
 * A toast with this text. Several can show at once, like one for sending an
 * application and one for finishing today's goals, so look for the one you mean.
 */
export const toast = (page: Page, text: RegExp | string) => page.getByRole('status').filter({ hasText: text });
