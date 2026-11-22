import { expect } from '@playwright/test';
import { emailFor, PASSWORD, signIn, test, waitForBoard } from './helpers';

const HEADLINE = 'A calmer way to organize your job search.';

test('signed-out visitors see the landing page, with ways to sign up and sign in', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: HEADLINE })).toBeVisible();
  // The real board, drawn from a screenshot, and loaded.
  const board = page.getByRole('img', { name: /^The Onward board/ });
  await expect(board).toBeVisible();
  expect(await board.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  // One "Get started" up top and one at the end, both to sign-up.
  const getStarted = page.getByRole('link', { name: 'Get started' });
  await expect(getStarted).toHaveCount(2);
  for (const link of await getStarted.all()) await expect(link).toHaveAttribute('href', '/signup');

  await getStarted.first().click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole('heading', { name: 'Start your job hunt' })).toBeVisible();

  await page.goBack();
  await page.getByRole('link', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('"See how it works" takes you to the walkthrough, keyboard focus included', async ({ page }) => {
  await page.goto('/');
  const walkthrough = page.getByRole('heading', { name: 'How it works' });

  await page.getByRole('link', { name: 'See how it works' }).focus();
  await page.keyboard.press('Enter');

  // The walkthrough's heading scrolls up to the top of the window.
  await expect.poll(() => walkthrough.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(80);
  await expect(walkthrough).toBeFocused();
  for (const step of [
    'Keep the details together.',
    'Tailor your resume with the AI you already use.',
    'Prepare a little at a time.',
    'See what you did this week.',
  ]) {
    await expect(page.getByRole('heading', { name: step })).toBeAttached();
  }
});

test('signed-in people go straight to their board, without the landing page flashing by', async ({ page }) => {
  await signIn(page, 'landing');

  // Notes whether the landing page's headline is ever drawn, even for a moment.
  await page.addInitScript(() => {
    const record = window as Window & { sawLanding?: boolean };
    record.sawLanding = false;
    new MutationObserver(() => {
      if (document.getElementById('hero-heading')) record.sawLanding = true;
    }).observe(document, { childList: true, subtree: true });
  });

  await page.goto('/');
  await waitForBoard(page);
  await expect(page).toHaveURL(/\/applications$/);
  expect(await page.evaluate(() => (window as Window & { sawLanding?: boolean }).sawLanding)).toBe(false);

  // The sign-in page still sends you on, too.
  await page.goto('/login');
  await expect(page).toHaveURL(/\/applications$/);
});

test('a link to a page inside the app still asks you to sign in, then takes you there', async ({ page }) => {
  await page.goto('/progress');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill(emailFor('landing'));
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
});
