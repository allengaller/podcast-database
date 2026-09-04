import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for the LeetCast web app.
 *
 * The dev server is started automatically. Tests run against `BASE_URL`
 * (default http://localhost:3000). Smoke tests below intentionally avoid
 * requiring Postgres / Redis / S3 by hitting public SSR routes and the
 * /api/health endpoint, which is gracefully degraded when those services
 * are offline.
 *
 * Run:
 *   pnpm --filter @leetcast/web test:e2e
 *   pnpm --filter @leetcast/web test:e2e -- --headed
 *   pnpm --filter @leetcast/web test:e2e -- --ui
 */
export default defineConfig({
  testDir: './e2e',
  // Only fail on a real test timeout; allow console errors to be inspected
  // rather than failing CI on benign logs.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Boot the Next production server before tests if a URL isn't already
  // running. We use `next start` (not `next dev`) so route compilation does
  // not race the first request — every page is precompiled at build time.
  webServer: process.env.SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm start',
        url: process.env.BASE_URL || 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
