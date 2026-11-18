import { expect } from '@playwright/test';
import { signIn, test, toast } from './helpers';

test('logging a networking message counts for the streak and shows in your history', async ({ page }) => {
  await signIn(page, 'log-win');
  const streak = page.getByRole('link', { name: /streak/i });
  await expect(streak).toHaveAttribute('title', /^No streak yet/);

  await streak.click();
  await expect(page).toHaveURL(/\/progress$/);
  await page.getByRole('button', { name: /Networking message/ }).click();
  await page.getByLabel('Note (optional)').fill('Messaged a designer from the meetup');
  await page.getByRole('button', { name: 'Log it' }).click();

  await expect(toast(page, /Message sent|You put yourself out there/)).toBeVisible();
  await expect(streak).toHaveAttribute('title', "1-day streak. You've shown up today.");
  await expect(page.getByText('Sent a networking message').first()).toBeVisible();

  await page.reload();
  await expect(streak).toHaveAttribute('title', "1-day streak. You've shown up today.");
});
