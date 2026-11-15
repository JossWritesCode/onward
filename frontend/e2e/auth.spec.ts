import { expect, test } from '@playwright/test';
import { emailFor, PASSWORD, signIn } from './helpers';

test('signs in and out', async ({ page }) => {
  await signIn(page, 'auth');
  await expect(page).toHaveURL(/\/applications$/);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Signed out means signed out: the board sends you back to sign in.
  await page.goto('/applications');
  await expect(page).toHaveURL(/\/login$/);
});

test('a wrong password says so and keeps you on the sign-in page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(emailFor('auth'));
  await page.getByLabel('Password').fill(`${PASSWORD}-wrong`);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
