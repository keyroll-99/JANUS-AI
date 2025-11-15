import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * Following project guidelines: Chromium only, Desktop Chrome
 */
export default defineConfig({
  testDir: './e2e',
  
  // Test timeout
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['null'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // API URL for backend calls
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers - Chromium only per guidelines
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  // NOTE: Make sure backend and frontend are running before tests
  // Backend: cd backend && npm run dev
  // Frontend: cd frontend && npm run dev
  webServer: process.env.CI ? [
    {
      command: 'npm --prefix backend run dev',
      url: 'http://localhost:5000/health',
      reuseExistingServer: false,
      timeout: 120 * 1000,
    },
    {
      command: 'npm --prefix frontend run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120 * 1000,
    },
  ] : undefined,
});
