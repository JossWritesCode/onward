import { expect, type Locator, type Page } from '@playwright/test';
import { signIn, test } from './helpers';

// Where page 1 and its label sit, against the scrolling preview panel they're in.
async function layout(scope: Locator) {
  return scope.evaluate((root) => {
    const rect = (element: Element | null) => {
      const r = element!.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const page = root.querySelector('[data-pdf-page="1"]');
    return { panel: rect(root.querySelector('[data-preview-viewport]')), page: rect(page) };
  });
}

const fitsInside = ({ panel, page }: Awaited<ReturnType<typeof layout>>) =>
  page.top >= panel.top && page.bottom <= panel.bottom + 0.5 && page.left >= panel.left && page.right <= panel.right;

const readout = async (scope: Locator) => parseInt((await scope.getByLabel(/^Zoom \d+%$/).textContent()) ?? '', 10);

async function openResume(page: Page) {
  await page.goto('/resumes');
  await page.getByRole('link', { name: /Frontend v3/ }).first().click();
  await expect(page.locator('aside [data-pdf-page="1"] canvas')).toBeVisible({ timeout: 30_000 });
}

test.beforeEach(async ({ page }) => {
  await signIn(page, 'resume-preview');
  await openResume(page);
});

test('shows a whole page by default, with Design closed', async ({ page }) => {
  const aside = page.locator('aside');
  await expect(aside.getByRole('button', { name: 'Fit page' })).toHaveAttribute('aria-pressed', 'true');
  await expect(aside.getByRole('button', { name: /^Design/ })).toHaveAttribute('aria-expanded', 'false');
  expect(fitsInside(await layout(aside))).toBe(true);
  // And on screen without scrolling the window.
  expect((await layout(aside)).page.bottom).toBeLessThanOrEqual(900);
});

test('Fit width fills the panel, and the zoom buttons step in tens within 25% to 300%', async ({ page }) => {
  const aside = page.locator('aside');
  const fitPage = await readout(aside);

  await aside.getByRole('button', { name: 'Fit width' }).click();
  await expect.poll(async () => {
    const { panel, page: sheet } = await layout(aside);
    return Math.abs(sheet.width - (panel.width - 32));
  }).toBeLessThanOrEqual(16);

  await aside.getByRole('button', { name: 'Fit page' }).click();
  await aside.getByRole('button', { name: 'Zoom in' }).click();
  const zoomedIn = await readout(aside);
  expect(zoomedIn % 10).toBe(0);
  expect(zoomedIn).toBeGreaterThan(fitPage);
  expect(zoomedIn - fitPage).toBeLessThanOrEqual(10);

  const zoomIn = aside.getByRole('button', { name: 'Zoom in' });
  while (await zoomIn.isEnabled()) await zoomIn.click();
  expect(await readout(aside)).toBe(300);

  const zoomOut = aside.getByRole('button', { name: 'Zoom out' });
  while (await zoomOut.isEnabled()) await zoomOut.click();
  expect(await readout(aside)).toBe(25);
});

test('Expand opens the preview over the whole window, and Escape or Close puts it back', async ({ page }) => {
  await page.locator('aside').getByRole('button', { name: 'Expand' }).click();
  const dialog = page.getByRole('dialog', { name: 'Resume preview' });
  await expect(dialog).toBeVisible();
  expect(await dialog.boundingBox()).toMatchObject({ x: 0, y: 0, width: 1440, height: 900 });
  await expect(dialog.locator('[data-pdf-page="1"] canvas')).toBeVisible();
  expect(fitsInside(await layout(dialog))).toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.locator('aside').getByRole('button', { name: 'Expand' }).click();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('remembers whether Design is open', async ({ page }) => {
  const design = () => page.locator('aside').getByRole('button', { name: /^Design/ });
  await design().click();
  await expect(design()).toHaveAttribute('aria-expanded', 'true');

  await page.reload();
  await expect(page.locator('aside [data-pdf-page="1"] canvas')).toBeVisible({ timeout: 30_000 });
  await expect(design()).toHaveAttribute('aria-expanded', 'true');

  await design().click();
  await page.reload();
  await expect(design()).toHaveAttribute('aria-expanded', 'false');
});

test('a two-page resume keeps page 1 and its "Page 1 of 2" label in view', async ({ page }) => {
  const aside = page.locator('aside');
  await page.getByLabel('Professional summary').fill(Array(160).fill('Built and shipped things that people used every day.').join(' '));
  await expect(aside.locator('[data-pdf-page="2"]')).toBeVisible({ timeout: 30_000 });
  await expect(aside.getByText('Page 1 of 2')).toBeVisible();

  const label = await aside.getByText('Page 1 of 2').boundingBox();
  const { panel } = await layout(aside);
  expect(label!.y + label!.height).toBeLessThanOrEqual(panel.bottom + 0.5);
  await expect(aside.getByText(/This runs onto 2 pages/)).toBeVisible();
  // Leave without saving.
  page.once('dialog', (dialog) => dialog.accept());
});
