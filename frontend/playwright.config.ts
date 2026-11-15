import { defineConfig, devices } from '@playwright/test';

// End-to-end tests: a real browser against the real Rails server and the React
// app. Run them with `npm run e2e` (or `bin/e2e` from the top folder), which
// resets their database first. See "Testing" in the README.

const RAILS_PORT = 3001;
const APP_PORT = 5174;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  // Spec files run side by side, each signed in as its own account. The tests
  // inside a file share that account, so they run one after another.
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    viewport: { width: 1440, height: 900 },
    // Fixed, so dates and times read the same on every computer.
    timezoneId: 'America/Toronto',
    locale: 'en-US',
    // Skips the confetti. Toasts still show.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Playwright's own Chromium by default. CHROME_PATH uses another Chrome,
    // for computers where `npx playwright install` can't download one.
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
  webServer: [
    {
      // Its own pid file, so it can run while your development server is up.
      command: `bin/rails server -p ${RAILS_PORT} -P tmp/pids/e2e-server.pid`,
      cwd: '../backend',
      url: `http://127.0.0.1:${RAILS_PORT}/up`,
      env: { RAILS_ENV: 'test', TEST_DATABASE: 'onward_e2e' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${APP_PORT} --strictPort`,
      url: `http://127.0.0.1:${APP_PORT}`,
      env: { ONWARD_API_URL: `http://127.0.0.1:${RAILS_PORT}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
