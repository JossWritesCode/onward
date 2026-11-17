import { expect, test } from '@playwright/test';
import { addDays, card, column, drag, pointIn, shortDay, signIn, todayInToronto, toast, waitForBoard } from './helpers';

// Moving a card back within a day takes back what the mistaken move recorded.

test.beforeEach(async ({ page }) => {
  await signIn(page, 'undo-move');
});

test('dragging a card to Applied and back takes the application back', async ({ page }) => {
  const streak = page.getByRole('link', { name: /streak/i });
  await expect(streak).toHaveAttribute('title', /^No streak yet/);

  await drag(page, card(page, 'Maple & Co'), await pointIn(column(page, 'Applied'), 0.5, 0.3));
  await expect(streak).toHaveAttribute('title', "1-day streak. You've shown up today.");

  await drag(page, card(page, 'Maple & Co'), await pointIn(column(page, 'Saved'), 0.5, 0.3));

  await expect(toast(page, "That won't count as an application.")).toBeVisible();
  await expect(column(page, 'Saved').locator(card(page, 'Maple & Co'))).toBeVisible();
  await expect(streak).toHaveAttribute('title', /^No streak yet/);

  await page.reload();
  await waitForBoard(page);
  await expect(streak).toHaveAttribute('title', /^No streak yet/);
  await expect(column(page, 'Saved').locator(card(page, 'Maple & Co'))).toBeVisible();
});

test('dragging a card to an interview column and back removes the checklist and keeps its follow-up date', async ({ page }) => {
  const today = todayInToronto();
  const brightline = card(page, 'Brightline');
  await expect(brightline).toContainText(`Follow up ${shortDay(today)}`);

  await drag(page, brightline, await pointIn(column(page, 'Phone screen'), 0.5, 0.3));
  await expect(toast(page, /You landed an interview|Interview stage unlocked/)).toBeVisible();
  // The interview column gave it a thank-you note for tomorrow: the move is saved.
  await expect(brightline).toContainText(shortDay(addDays(today, 1)));

  await drag(page, brightline, await pointIn(column(page, 'Applied'), 0.5, 0.3));

  await expect(toast(page, "That won't count as an interview.")).toBeVisible();
  await expect(column(page, 'Applied').locator(brightline)).toBeVisible();
  await expect(brightline).toContainText(`Follow up ${shortDay(today)}`);
  await expect(page.getByRole('link', { name: /streak/i })).toHaveAttribute('title', /^No streak yet/);

  await brightline.getByRole('link').first().click();
  await expect(page.getByLabel('Company')).toHaveValue('Brightline');
  await expect(page.getByRole('progressbar', { name: 'Phone screen prep progress' })).toHaveCount(0);
});
