import { expect, type Page } from '@playwright/test';
import { signIn, test } from './helpers';

const html = (page: Page) => page.locator('html');
const header = (page: Page) => page.getByRole('banner');
const bodyBackground = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('the gear opens Settings, which has your account, and the old account address leads there', async ({ page }) => {
  await signIn(page, 'settings');

  await header(page).getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
  await expect(page.getByText('settings@e2e.onward.test')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Delete my account' })).toBeVisible();

  await page.goto('/account');
  await expect(page).toHaveURL(/\/settings$/);
});

test('picking dark or light recolors the page and lasts after a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await signIn(page, 'settings');
  await page.goto('/settings');
  await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  const light = await bodyBackground(page);

  await page.getByText('Dark', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => bodyBackground(page)).not.toBe(light);

  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();

  // Your pick wins over the computer's setting.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByText('Light', { exact: true }).click();
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => bodyBackground(page)).toBe(light);
});

test('"System" follows the computer as it switches', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await signIn(page, 'settings');
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
});

test('the engineering track is turned on from Settings and adds its header link', async ({ page }) => {
  await signIn(page, 'settings');
  await expect(header(page).getByRole('link', { name: 'Engineering' })).toHaveCount(0);

  // The Engineering page's "Turn it on" leads to that part of Settings.
  await page.goto('/engineering');
  await page.getByRole('link', { name: 'Turn it on' }).click();
  await expect(page).toHaveURL(/\/settings#engineering$/);

  await page.getByRole('switch', { name: 'Show the Engineering page' }).check({ force: true });
  await expect(header(page).getByRole('link', { name: 'Engineering' })).toBeVisible();

  await page.getByLabel('LeetCode username').fill('dana-codes');
  await page.getByLabel('GitHub username').fill('danawhitfield');
  await page.getByRole('button', { name: 'Save accounts' }).click();
  await page.reload();
  await expect(page.getByLabel('LeetCode username')).toHaveValue('dana-codes');
  await expect(page.getByLabel('GitHub username')).toHaveValue('danawhitfield');

  // Prep settings are only about prep now.
  await page.goto('/prep/customize');
  await expect(page.getByRole('heading', { name: 'Interview checklist' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Software engineering track' })).toHaveCount(0);
});

test('on a phone, the header has sound and the gear, and you sign out from Settings', async ({ page }) => {
  await signIn(page, 'settings');
  await page.setViewportSize({ width: 375, height: 800 });

  await expect(header(page).getByRole('button', { name: /Turn sounds (on|off)/ })).toBeVisible();
  await expect(header(page).getByRole('button', { name: 'Sign out' })).toBeHidden();

  await header(page).getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
