import { expect } from '@playwright/test';
import { signIn, test } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page, 'resume-import');
  await page.goto('/resumes/new');
});

test('formats pasted JSON with the usual AI slips into a new resume', async ({ page }) => {
  // A code fence, a sentence before it, curly quotes, ** bold leftovers, and a trailing comma.
  const pasted = [
    "Here's your resume in Onward's format:",
    '```json',
    '{',
    '  "name": "Robin Okafor",',
    '  “title”: “Data Analyst”,',
    '  "summary": "**Analyst** who turns messy data into decisions.",',
    '  "skills": [{ "label": "Tools", "items": ["SQL", "Python",] }],',
    '}',
    '```',
  ].join('\n');
  await page.getByLabel("The AI's reply").fill(pasted);
  await page.getByRole('button', { name: 'Format' }).click();

  await expect(page).toHaveURL(/\/resumes\/\d+$/);
  await expect(page.locator('#resume-name')).toHaveValue('Robin Okafor');
  await expect(page.getByLabel('Professional summary')).toHaveValue('Analyst who turns messy data into decisions.');
  await expect(page.locator('aside [data-pdf-page="1"] canvas')).toBeVisible({ timeout: 30_000 });
});

test('says which line broken JSON broke on, and saves nothing', async ({ page }) => {
  await page.getByLabel("The AI's reply").fill('{\n  "name": "Never Saved"\n  "title": "Data Analyst"\n}');
  await page.getByRole('button', { name: 'Format' }).click();

  await expect(page.getByRole('alert')).toContainText('Line 2: missing a comma');
  await expect(page).toHaveURL(/\/resumes\/new$/);

  await page.goto('/resumes');
  await expect(page.getByRole('link', { name: /Frontend v3/ }).first()).toBeVisible();
  await expect(page.getByText('Never Saved')).toHaveCount(0);
});
