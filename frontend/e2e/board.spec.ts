import { expect, test } from '@playwright/test';
import { card, column, drag, pointIn, signIn, toast } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page, 'board');
});

test('dragging a card to Applied moves it, celebrates, and starts the streak', async ({ page }) => {
  const streak = page.getByRole('link', { name: /streak/i });
  await expect(streak).toHaveAttribute('title', /^No streak yet/);

  await drag(page, card(page, 'Maple & Co'), await pointIn(column(page, 'Applied'), 0.5, 0.3));

  await expect(column(page, 'Applied').locator(card(page, 'Maple & Co'))).toBeVisible();
  await expect(toast(page, /Application sent|Another one out the door|Nice work|Sent/)).toBeVisible();
  await expect(streak).toHaveAttribute('title', "1-day streak. You've shown up today.");

  // Saved on the server, not just on screen.
  await page.reload();
  await expect(column(page, 'Applied').locator(card(page, 'Maple & Co'))).toBeVisible();
});

test('clicking a card opens it', async ({ page }) => {
  await card(page, 'Northwind Labs').getByRole('link').first().click();
  await expect(page).toHaveURL(/\/applications\/\d+$/);
  await expect(page.getByLabel('Company')).toHaveValue('Northwind Labs');
});
