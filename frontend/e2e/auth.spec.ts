import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Authenticated flow tests.
 *
 * These run against a Next.js dev server booted in `NODE_ENV=development`
 * (see playwright.config.ts webServer). The dev-only Credentials provider
 * in `src/auth.ts` is enabled in that mode, allowing us to exercise
 * authenticated routes without a real GitHub OAuth round-trip.
 *
 * Routes that need a database (e.g. /api/progress) will return 500 in the
 * CI environment; we treat that as "auth was applied" and the test still
 * proves the unauthenticated path returns 401.
 */
// See smoke.spec.ts for the rationale: serial execution keeps the in-memory
// rate limiter from being starved by parallel workers.
test.describe.configure({ mode: 'serial' });

test.describe('LeetCast auth flow', () => {
  test('dev login page is reachable in development', async ({ page }) => {
    const response = await page.goto(`${BASE}/login/dev`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    // The form should render a username field.
    await expect(page.getByTestId('dev-username')).toBeAttached();
  });

  test('POST /api/progress without session returns 401', async ({ request }) => {
    const response = await request.post(`${BASE}/api/progress`, {
      data: { podcastId: 'x', progress: 10 },
    });
    expect(response.status()).toBe(401);
  });

  test('logging in via /login/dev establishes a session', async ({ page }) => {
    // Walk the dev login flow.
    await page.goto(`${BASE}/login/dev`);
    await page.getByTestId('dev-username').fill('e2e-user');
    await page.getByTestId('dev-submit').click();

    // After the server action completes we should be on the home page.
    await page.waitForURL(`${BASE}/`, { timeout: 10_000 });

    // Reuse the same authenticated context (page.request shares the browser
    // cookie jar) to verify /api/progress is no longer 401. With no DB it
    // will 500, but never 401.
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.includes('session') || c.name.includes('auth')
    );
    expect(sessionCookie, 'next-auth should have set a session cookie').toBeDefined();

    const response = await page.request.post(`${BASE}/api/progress`, {
      data: { podcastId: 'x', progress: 10 },
    });
    // 200 / 500 = auth succeeded, request reached the handler.
    // 401 = auth did NOT succeed.
    expect([200, 500]).toContain(response.status());
  });

  test('clearing the session cookie reverts /api/progress to 401', async ({ page, context }) => {
    await page.goto(`${BASE}/login/dev`);
    await page.getByTestId('dev-username').fill('logout-user');
    await page.getByTestId('dev-submit').click();
    await page.waitForURL(`${BASE}/`, { timeout: 10_000 });

    // Confirm we are authenticated.
    let cookies = await context.cookies();
    const beforeCookie = cookies.find((c) => c.name.includes('session-token'));
    expect(beforeCookie, 'session cookie should exist after login').toBeDefined();

    // Simulate sign-out: clear the session-token cookie via the browser
    // context. (We do not exercise NextAuth's /api/auth/signout endpoint
    // because its CSRF handshake is brittle to assert in a smoke test;
    // this is what the application's `signOut()` server action does
    // client-side anyway.)
    await context.clearCookies();

    cookies = await context.cookies();
    const afterCookie = cookies.find((c) => c.name.includes('session-token'));
    expect(afterCookie, 'session cookie should be cleared after logout').toBeUndefined();

    // Without the session cookie, /api/progress must return 401.
    const response = await page.request.post(`${BASE}/api/progress`, {
      data: { podcastId: 'x', progress: 10 },
    });
    expect(response.status()).toBe(401);
  });
});
