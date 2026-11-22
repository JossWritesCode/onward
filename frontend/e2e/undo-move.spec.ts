import { expect } from '@playwright/test';
import { addDays, card, column, moveCard, pointIn, shortDay, signIn, test, toast, todayInToronto, waitForBoard } from './helpers';

// Moving a card back within a day takes back what the mistaken move recorded.

test.beforeEach(async ({ page }) => {
  await signIn(page, 'undo-move');
});

test('dragging a card to Applied and back takes the application back', async ({ page }) => {
  const streak = page.getByRole('link', { name: 'Progress' });
  await expect(streak).toHaveAttribute('title', /^No streak yet/);

  await moveCard(page, card(page, 'Maple & Co'), await pointIn(column(page, 'Applied'), 0.5, 0.3));
  await expect(column(page, 'Applied').locator(card(page, 'Maple & Co'))).toBeVisible();
  await expect(streak).toHaveAttribute('title', "1-day streak. You've shown up today.");

  await moveCard(page, card(page, 'Maple & Co'), await pointIn(column(page, 'Saved'), 0.5, 0.3));

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

  await moveCard(page, brightline, await pointIn(column(page, 'Phone screen'), 0.5, 0.3));
  await expect(toast(page, 'Interview recorded')).toBeVisible();
  // Saved: it's in the interview column, with a thank-you note due tomorrow.
  await expect(column(page, 'Phone screen').locator(brightline)).toContainText(`Follow up ${shortDay(addDays(today, 1))}`);

  await moveCard(page, brightline, await pointIn(column(page, 'Applied'), 0.5, 0.3));

  await expect(toast(page, "That won't count as an interview.")).toBeVisible();
  await expect(column(page, 'Applied').locator(brightline)).toBeVisible();
  await expect(brightline).toContainText(`Follow up ${shortDay(today)}`);
  await expect(page.getByRole('link', { name: 'Progress' })).toHaveAttribute('title', /^No streak yet/);

  await brightline.getByRole('link').first().click();
  await expect(page.getByLabel('Company')).toHaveValue('Brightline');
  await expect(page.getByRole('progressbar', { name: 'Phone screen prep progress' })).toHaveCount(0);
});
