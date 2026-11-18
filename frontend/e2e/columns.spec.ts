import { expect } from '@playwright/test';
import { column, columnOrder, drag, pointIn, signIn, test, waitForBoard } from './helpers';

const START = ['Saved', 'Applied', 'Phone screen', 'Interviewing', 'Offer', 'Rejected'];

test.beforeEach(async ({ page }) => {
  await signIn(page, 'columns');
});

test('every column has a grip', async ({ page }) => {
  await expect.poll(() => columnOrder(page)).toEqual(START);
  await expect(page.locator('[data-column-grip]')).toHaveCount(START.length);
  for (const grip of await page.locator('[data-column-grip]').all()) await expect(grip).toBeVisible();
});

test('dragging a grip moves the column, and the order is saved', async ({ page }) => {
  const grip = column(page, 'Saved').locator('[data-column-grip]');
  await drag(page, grip, await pointIn(column(page, 'Phone screen'), 0.8, 0.1), { release: false });
  await expect(page.locator('[data-column-placeholder]')).toHaveCount(1);
  await page.mouse.up();

  const moved = ['Applied', 'Phone screen', 'Saved', 'Interviewing', 'Offer', 'Rejected'];
  await expect.poll(() => columnOrder(page)).toEqual(moved);
  await page.reload();
  await waitForBoard(page);
  await expect.poll(() => columnOrder(page)).toEqual(moved);
});

test('Escape cancels a column drag', async ({ page }) => {
  const before = await columnOrder(page);
  await drag(page, page.locator('[data-column-grip]').first(), await pointIn(column(page, 'Offer'), 0.8, 0.1), { release: false });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('[data-column-placeholder]')).toHaveCount(0);
  expect(await columnOrder(page)).toEqual(before);
});

test("dragging a column's title, not its grip, does nothing", async ({ page }) => {
  const before = await columnOrder(page);
  const title = page.locator('section[data-stage-id] h2').first();
  await drag(page, title, await pointIn(column(page, 'Offer'), 0.8, 0.1), { release: false });
  await expect(page.locator('[data-column-placeholder]')).toHaveCount(0);
  await page.mouse.up();
  expect(await columnOrder(page)).toEqual(before);
});

test('the Add or edit columns page still reorders with its buttons', async ({ page }) => {
  await page.goto('/columns');
  // Top to bottom on this page, which changes once the server has the new order.
  const listed = () =>
    page.getByRole('button', { name: /^Move .+ left$/ }).evaluateAll((buttons) => buttons.map((b) => b.getAttribute('aria-label')!.slice(5, -5)));
  await expect.poll(listed).toEqual(START);
  // Saved starts first, so it can't move left.
  await expect(page.getByRole('button', { name: 'Move Saved left' })).toBeDisabled();

  const right = page.getByRole('button', { name: 'Move Saved right' });
  await right.click();
  await expect.poll(listed).toEqual(['Applied', 'Saved', 'Phone screen', 'Interviewing', 'Offer', 'Rejected']);
  await right.click();
  const moved = ['Applied', 'Phone screen', 'Saved', 'Interviewing', 'Offer', 'Rejected'];
  await expect.poll(listed).toEqual(moved);

  await page.goto('/applications');
  await waitForBoard(page);
  await expect.poll(() => columnOrder(page)).toEqual(moved);
});
