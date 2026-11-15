import { expect, test } from '@playwright/test';
import { card, column, signIn } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page, 'applications');
});

test('adds an application to a column', async ({ page }) => {
  await page.getByRole('link', { name: 'Add application' }).click();
  await page.getByLabel('Company').fill('Shopify');
  await page.getByLabel('Role').fill('Backend Developer');
  await page.getByLabel('Column').selectOption({ label: 'Saved' });
  await page.getByRole('button', { name: 'Add application' }).click();

  await expect(page).toHaveURL(/\/applications$/);
  const shopify = card(page, 'Shopify');
  await expect(column(page, 'Saved').locator(shopify)).toBeVisible();
  await expect(shopify).toContainText('Backend Developer');
});

test('needs a company and a role', async ({ page }) => {
  await page.getByRole('link', { name: 'Add application' }).click();
  await page.getByRole('button', { name: 'Add application' }).click();

  await expect(page).toHaveURL(/\/applications\/new/);
  await expect(page.getByText(/can't be blank|required/i).first()).toBeVisible();
});

test('edits an application', async ({ page }) => {
  await card(page, 'Maple & Co').getByRole('link').first().click();
  await page.getByLabel('Role').fill('Software Developer');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page).toHaveURL(/\/applications$/);
  await expect(card(page, 'Maple & Co')).toContainText('Software Developer');
});
