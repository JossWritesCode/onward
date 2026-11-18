import { expect } from '@playwright/test';
import { addDays, card, shortDay, signIn, test, toast, todayInToronto } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page, 'follow-up');
});

test('"I followed up" logs it and sets the next follow-up a week out', async ({ page }) => {
  const today = todayInToronto();
  await expect(card(page, 'Brightline')).toContainText(`Follow up ${shortDay(today)}`);
  // Northwind's follow-up isn't due yet, so only Brightline asks.
  await expect(page.getByText('Follow up with Northwind Labs')).toHaveCount(0);

  const nudge = page.getByText('Follow up with Brightline');
  await expect(nudge).toBeVisible();
  await page.getByRole('button', { name: 'I followed up' }).click();

  await expect(toast(page, /Follow-up sent|Nicely done/)).toBeVisible();
  await expect(nudge).toBeHidden();
  await expect(card(page, 'Brightline')).toContainText(`Follow up ${shortDay(addDays(today, 7))}`);

  await page.reload();
  await expect(card(page, 'Brightline')).toContainText(`Follow up ${shortDay(addDays(today, 7))}`);
  await expect(page.getByText('Follow up with Brightline')).toHaveCount(0);
});
