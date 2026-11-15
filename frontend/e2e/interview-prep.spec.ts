import { expect, test } from '@playwright/test';
import { card, column, drag, pointIn, signIn, toast } from './helpers';

test('moving a card to an interview column starts a prep checklist, and finishing it celebrates', async ({ page }) => {
  await signIn(page, 'interview-prep');

  await drag(page, card(page, 'Brightline'), await pointIn(column(page, 'Phone screen'), 0.5, 0.3));
  await expect(column(page, 'Phone screen').locator(card(page, 'Brightline'))).toBeVisible();
  await expect(toast(page, /You landed an interview|Interview stage unlocked/)).toBeVisible();

  await card(page, 'Brightline').getByRole('link').first().click();
  await expect(page).toHaveURL(/\/applications\/\d+$/);
  const progress = page.getByRole('progressbar', { name: 'Phone screen prep progress' });
  await expect(progress).toHaveAttribute('aria-valuenow', '0');

  const steps = page.getByRole('checkbox');
  const count = await steps.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    // The box ticks once the server says so, so click and wait rather than check().
    await steps.nth(i).click();
    await expect(steps.nth(i)).toBeChecked();
  }

  await expect(progress).toHaveAttribute('aria-valuenow', '100');
  await expect(toast(page, "You're ready")).toBeVisible();
});
