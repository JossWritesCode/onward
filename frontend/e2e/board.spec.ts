import { expect } from '@playwright/test';
import { card, column, drag, pointIn, signIn, test, toast } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page, 'board');
});

test('dragging a card to Applied moves it, celebrates, and starts the streak', async ({ page }) => {
  const streak = page.getByRole('link', { name: 'Progress' });
  await expect(streak).toHaveAttribute('title', /^No streak yet/);

  await drag(page, card(page, 'Maple & Co'), await pointIn(column(page, 'Applied'), 0.5, 0.3));

  await expect(column(page, 'Applied').locator(card(page, 'Maple & Co'))).toBeVisible();
  await expect(toast(page, 'Application sent')).toBeVisible();
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

// Counts the tones Onward starts, so a test can tell how many sounds played.
// Each sound starts all of its tones within a few milliseconds of each other.
async function listenForSounds(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const starts: number[] = [];
    (window as unknown as { toneStarts: number[] }).toneStarts = starts;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      createOscillator() {
        const oscillator = super.createOscillator();
        const start = oscillator.start.bind(oscillator);
        oscillator.start = (when?: number) => {
          starts.push(performance.now());
          start(when);
        };
        return oscillator;
      }
    } as typeof AudioContext;
  });
}

/** How many separate sounds played: tones started within 50 ms of each other are one sound. */
async function soundsPlayed(page: import('@playwright/test').Page) {
  const starts = await page.evaluate(() => (window as unknown as { toneStarts: number[] }).toneStarts);
  return starts.filter((at, i) => i === 0 || at - starts[i - 1] > 50).length;
}

test('an application that also completes a daily goal plays one sound and shows one toast', async ({ page }) => {
  await listenForSounds(page);
  await page.reload();
  // Every account starts with the daily goal "Apply to 1 job", not yet done.
  await expect(page.getByRole('link', { name: /Apply to 1 job: 0\/1/ })).toBeVisible();

  await drag(page, card(page, 'Maple & Co'), await pointIn(column(page, 'Applied'), 0.5, 0.3));

  // The goal note joins the application's toast instead of stacking a second one.
  const sent = toast(page, 'Application sent');
  await expect(sent).toContainText("Today's goals are complete.");
  await expect(page.getByRole('status').filter({ hasText: /Today's goals are complete/ })).toHaveCount(1);
  expect(await soundsPlayed(page)).toBe(1);
});

test('with sounds off, the same application stays silent but still shows its toast', async ({ page }) => {
  await listenForSounds(page);
  await page.reload();
  await page.getByRole('button', { name: 'Turn sounds off' }).click();
  await expect(page.getByRole('link', { name: /Apply to 1 job: 0\/1/ })).toBeVisible();

  await drag(page, card(page, 'Maple & Co'), await pointIn(column(page, 'Applied'), 0.5, 0.3));

  await expect(toast(page, 'Application sent')).toContainText("Today's goals are complete.");
  expect(await soundsPlayed(page)).toBe(0);
});
