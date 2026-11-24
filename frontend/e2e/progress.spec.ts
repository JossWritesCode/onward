import { expect } from '@playwright/test';
import { signIn, test, toast } from './helpers';

test.describe('sharing the weekly recap', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'progress');
    await page.getByRole('link', { name: 'Progress' }).click();
    await page.getByRole('button', { name: 'Share', exact: true }).click();
  });

  test('offers to download, copy, or text the recap', async ({ page }) => {
    const menu = page.getByRole('menu', { name: 'Share your week' });
    await expect(menu.getByRole('menuitem', { name: 'Download image' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Copy image' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Text it to someone' })).toHaveAttribute('href', /^sms:\?&body=My%20job%20hunt/);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeFocused();
  });

  test('downloads the image', async ({ page }) => {
    const download = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: 'Download image' }).click();
    expect((await download).suggestedFilename()).toMatch(/^onward-week-of-\d{4}-\d{2}-\d{2}\.png$/);
    await expect(toast(page, 'Saved')).toBeVisible();
  });

  test('copies the image', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('menuitem', { name: 'Copy image' }).click();
    await expect(toast(page, 'Copied')).toBeVisible();
    const types = await page.evaluate(async () => (await navigator.clipboard.read())[0]?.types ?? []);
    expect(types).toContain('image/png');
  });
});
