import { expect, type Page } from '@playwright/test';
import { card, signIn, test } from './helpers';

// To read what "Copy message for ChatGPT" put on the clipboard.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const JOB_DESCRIPTION = 'Brightline is hiring a frontend developer to own our design system.\n\nYou know React and accessibility.';

/** ChatGPT's reply: the summary reworded, contact details left blank. */
function reply(summary: string) {
  return [
    "Here's your tailored resume:",
    '```json',
    JSON.stringify({ name: 'Dana Whitfield', title: 'Design Systems Engineer', email: '', phone: '', summary }, null, 2),
    '```',
  ].join('\n');
}

async function openBrightline(page: Page) {
  await card(page, 'Brightline').getByRole('link').first().click();
  await expect(page.getByRole('heading', { name: 'Resume' })).toBeVisible();
}

async function clipboard(page: Page) {
  return page.evaluate(() => navigator.clipboard.readText());
}

test.beforeEach(async ({ page }) => {
  await signIn(page, 'tailor-resume');
});

test('tailors a base resume through ChatGPT, with the job description in the message', async ({ page }) => {
  await openBrightline(page);
  const copy = page.getByRole('button', { name: 'Copy message for ChatGPT' });
  // Brightline has no job description yet, so it asks for one first.
  await expect(copy).toBeDisabled();
  await page.getByLabel('Paste the job description').fill(JOB_DESCRIPTION);
  // It fills the application's own field too.
  await expect(page.locator('#job-description')).toHaveValue(JOB_DESCRIPTION);

  await copy.click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  await expect(page.getByText('Job description saved with this application.')).toBeVisible();
  const message = await clipboard(page);
  expect(message).toContain('The job: Frontend Developer at Brightline');
  expect(message).toContain(JOB_DESCRIPTION);
  // The base resume, "Frontend v3".
  expect(message).toContain('"name": "Dana Whitfield"');
  expect(message).toContain('Rebuilt the booking flow in React and TypeScript');

  await page.getByLabel("ChatGPT's reply").fill(reply('Frontend developer who builds accessible design systems.'));
  await page.getByRole('button', { name: 'Make tailored resume' }).click();

  await expect(page).toHaveURL(/\/resumes\/\d+$/);
  await expect(page.getByLabel('Professional summary')).toHaveValue('Frontend developer who builds accessible design systems.');
  // Left blank in the reply, so it kept the base resume's.
  await expect(page.locator('#resume-email')).toHaveValue('dana.whitfield@example.com');
  await expect(page.getByText('Tailored for Brightline')).toBeVisible();

  // Linked to Brightline, and the job description was saved with it.
  await page.goto('/applications');
  await openBrightline(page);
  await expect(page.getByText('Frontend v3 – Brightline')).toBeVisible();
  await expect(page.locator('#job-description')).toHaveValue(JOB_DESCRIPTION);
});

test("copies the message even when the job description won't save, and saves it on Try again", async ({ page }) => {
  // First the network fails, then the server turns the description down.
  let attempt = 0;
  await page.route('**/graphql', async (route) => {
    if (route.request().postDataJSON()?.operationName !== 'UpdateJobApplication') return route.continue();
    attempt += 1;
    if (attempt === 1) return route.abort('internetdisconnected');
    return route.fulfill({
      json: {
        data: {
          updateJobApplication: {
            __typename: 'UpdateJobApplicationPayload',
            undone: [],
            jobApplication: null,
            errors: [{ __typename: 'UserError', field: 'jobDescription', message: 'Job description is too long.' }],
          },
        },
      },
    });
  });
  await openBrightline(page);
  await page.getByLabel('Paste the job description').fill(JOB_DESCRIPTION);

  await page.getByRole('button', { name: 'Copy message for ChatGPT' }).click();
  const problem = page.getByRole('alert');
  await expect(problem).toContainText("We couldn't save the job description: Check your connection.");
  await expect(problem).toContainText('The message was still copied.');
  expect(await clipboard(page)).toContain(JOB_DESCRIPTION);

  await problem.getByRole('button', { name: 'Try again' }).click();
  await expect(problem).toContainText("We couldn't save the job description: Job description is too long.");

  await page.unroute('**/graphql');
  await problem.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('Job description saved with this application.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);

  await page.reload();
  await expect(page.locator('#job-description')).toHaveValue(JOB_DESCRIPTION);
});

test("a reply that can't be read says where it broke and saves nothing", async ({ page }) => {
  await openBrightline(page);
  await page.getByLabel('Paste the job description').fill(JOB_DESCRIPTION);
  await page.getByLabel("ChatGPT's reply").fill('{\n  "name": "Dana Whitfield"\n  "summary": "Missing a comma"\n}');
  await page.getByRole('button', { name: 'Make tailored resume' }).click();

  await expect(page.getByRole('alert')).toContainText('Line 2: missing a comma');
  await expect(page).toHaveURL(/\/applications\/\d+/);
  await expect(page.getByRole('button', { name: 'Make tailored resume' })).toBeVisible();
});

test('re-tailors a tailored resume, replacing its content', async ({ page }) => {
  await openBrightline(page);
  await page.getByRole('button', { name: 'Copy it as it is' }).click();
  await expect(page).toHaveURL(/\/resumes\/\d+$/);

  await page.goto('/applications');
  await openBrightline(page);
  await page.getByRole('button', { name: 'Re-tailor' }).click();
  await page.getByLabel('Paste the job description').fill(JOB_DESCRIPTION);
  await page.getByRole('button', { name: 'Copy message for ChatGPT' }).click();
  const message = await clipboard(page);
  expect(message).toMatch(/^My resume below is already tailored for this job/);
  expect(message).toContain(JOB_DESCRIPTION);

  await page.getByLabel("ChatGPT's reply").fill(reply('Second pass, closer to the posting.'));
  await page.getByRole('button', { name: 'Replace with this version' }).click();

  await expect(page).toHaveURL(/\/resumes\/\d+$/);
  await expect(page.getByLabel('Professional summary')).toHaveValue('Second pass, closer to the posting.');
  await expect(page.locator('#resume-headline')).toHaveValue('Design Systems Engineer');
  await expect(page.getByText('Re-tailored for Brightline')).toBeVisible();
});

test('"Tailor for…" on the Resumes page goes to the application with that resume picked', async ({ page }) => {
  await page.goto('/resumes');
  await page.getByRole('button', { name: 'Tailor for…' }).click();
  await page.getByLabel('Tailor a copy for which application?').selectOption({ label: 'Northwind Labs · Full Stack Engineer' });
  await page.getByRole('button', { name: 'Tailor', exact: true }).click();

  await expect(page).toHaveURL(/\/applications\/\d+\?tailor=\d+$/);
  await expect(page.getByLabel('Start from')).toHaveValue(new URL(page.url()).searchParams.get('tailor')!);
  await expect(page.getByRole('button', { name: 'Make tailored resume' })).toBeVisible();
});

test('edits the instructions in the message, and saves them as the default for next time', async ({ page }) => {
  await openBrightline(page);
  await page.getByLabel('Paste the job description').fill(JOB_DESCRIPTION);

  await page.getByRole('button', { name: 'Edit message' }).click();
  const instructions = page.getByLabel('Instructions for ChatGPT');
  await expect(instructions).toHaveValue(/^Tailor my resume for the job below/);
  await instructions.fill('Tailor my resume for this job. Keep it to two bullets per role.');

  // The edit goes into this copy, before it's saved as the default.
  await page.getByRole('button', { name: 'Copy message for ChatGPT' }).click();
  const message = await clipboard(page);
  expect(message).toMatch(/^Tailor my resume for this job\. Keep it to two bullets per role\.\n\nThe job: Frontend Developer at Brightline/);
  expect(message).toContain('"name": "Dana Whitfield"');
  expect(message).not.toContain('Stay truthful');

  await expect(page.getByText('Not saved as your default yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Save as my default' }).click();
  await expect(page.getByText('Every new message starts with these instructions.')).toBeVisible();

  // Next time, the message starts from the saved instructions.
  await page.reload();
  await page.getByRole('button', { name: 'Edit message' }).click();
  await expect(page.getByLabel('Instructions for ChatGPT')).toHaveValue(
    'Tailor my resume for this job. Keep it to two bullets per role.',
  );

  // And Onward's own can come back.
  await page.getByRole('button', { name: "Use Onward's default" }).click();
  await expect(page.getByLabel('Instructions for ChatGPT')).toHaveValue(/Stay truthful/);
  await page.getByRole('button', { name: 'Save as my default' }).click();
  await expect(page.getByText('Every new message starts with these instructions.')).toBeVisible();
  await page.getByRole('button', { name: 'Copy message for ChatGPT' }).click();
  expect(await clipboard(page)).toMatch(/^Tailor my resume for the job below/);
});
