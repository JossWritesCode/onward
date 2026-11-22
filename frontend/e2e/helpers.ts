import path from 'node:path';
import { test as base, expect, type Locator, type Page, type Response } from '@playwright/test';
import { RAILS_URL } from './ports';

/**
 * The accounts in backend/lib/e2e_accounts.rb. Each spec file signs in as its
 * own, named for the file, so files running side by side never move each
 * other's cards.
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
  | 'interview-prep'
  | 'undo-move'
  | 'tailor-resume'
  | 'settings'
  | 'landing';

const ACCOUNTS: readonly Account[] = [
  'auth',
  'applications',
  'board',
  'columns',
  'resume-preview',
  'resume-import',
  'log-win',
  'follow-up',
  'interview-prep',
  'undo-move',
  'tailor-resume',
  'settings',
  'landing',
];

/**
 * Playwright's `test`, with one addition: before each test, the account named
 * for the spec file (board.spec.ts uses "board") is rebuilt on the server, so
 * every test starts from the seeded data. That keeps the tests in a file from
 * leaning on each other, and makes a retry on CI a real second try rather than
 * a run against whatever the failed attempt left behind.
 *
 * Spec files import `test` from here, not from '@playwright/test'.
 */
export const test = base.extend<{ freshAccount: Account }>({
  freshAccount: [
    async ({ playwright }, use, testInfo) => {
      const account = path.basename(testInfo.file, '.spec.ts') as Account;
      if (!ACCOUNTS.includes(account)) {
        throw new Error(`No end-to-end account for ${path.basename(testInfo.file)}. Add "${account}" to E2eAccounts in backend/lib/e2e_accounts.rb and to ACCOUNTS in e2e/helpers.ts.`);
      }
      const request = await playwright.request.newContext({ baseURL: RAILS_URL });
      const response = await request.post(`/e2e/reset/${account}`);
      await request.dispose();
      if (!response.ok()) throw new Error(`Resetting the ${account} account failed: HTTP ${response.status()}`);
      await use(account);
    },
    { auto: true },
  ],
});

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
 *
 * It waits for the thing to be on screen and holding still first, since the
 * board can redraw a card just as a test reaches for it.
 */
export async function drag(page: Page, from: Locator, to: { x: number; y: number }, { release = true } = {}) {
  // A trial hover runs Playwright's checks (attached, visible, stable, not
  // covered) without moving the mouse.
  await from.hover({ trial: true });
  let box: Awaited<ReturnType<Locator['boundingBox']>> = null;
  await expect
    .poll(async () => (box = await from.boundingBox()), { message: 'Nothing to drag from', timeout: 5_000 })
    .not.toBeNull();
  const { x, y, width, height } = box!;
  const start = { x: x + Math.min(width / 2, 30), y: y + Math.min(height / 2, 20) };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 12, start.y + 8, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 15 });
  if (release) await page.mouse.up();
}

/** The GraphQL operation a response answers, like "Board". */
function operationOf(response: Response): string | undefined {
  if (!response.url().endsWith('/graphql')) return undefined;
  try {
    return response.request().postDataJSON()?.operationName;
  } catch {
    return undefined;
  }
}

/**
 * Drags a card to a point and waits until the move is saved and the board has
 * fetched itself again, so the card won't be redrawn under the next step.
 * Use it whenever a test goes on to drag, click, or check the same card.
 */
export async function moveCard(page: Page, from: Locator, to: { x: number; y: number }) {
  let onResponse: (response: Response) => void = () => {};
  const settled = new Promise<void>((resolve) => {
    let saved = false;
    onResponse = (response) => {
      const operation = operationOf(response);
      if (operation === 'MoveJobApplication') saved = true;
      else if (saved && operation === 'Board') void response.finished().then(() => resolve());
    };
    page.on('response', onResponse);
  });
  try {
    await drag(page, from, to);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('The move never saved, or the board never refetched')), 10_000);
    });
    await Promise.race([settled, timeout]).finally(() => clearTimeout(timer));
  } finally {
    page.off('response', onResponse);
  }
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
