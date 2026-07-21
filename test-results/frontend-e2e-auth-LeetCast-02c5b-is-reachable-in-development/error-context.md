# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend/e2e/auth.spec.ts >> LeetCast auth flow >> dev login page is reachable in development
- Location: frontend/e2e/auth.spec.ts:22:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login/dev
Call log:
  - navigating to "http://localhost:3000/login/dev", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE = process.env.BASE_URL || 'http://localhost:3000';
  4  | 
  5  | /**
  6  |  * Authenticated flow tests.
  7  |  *
  8  |  * These run against a Next.js dev server booted in `NODE_ENV=development`
  9  |  * (see playwright.config.ts webServer). The dev-only Credentials provider
  10 |  * in `src/auth.ts` is enabled in that mode, allowing us to exercise
  11 |  * authenticated routes without a real GitHub OAuth round-trip.
  12 |  *
  13 |  * Routes that need a database (e.g. /api/progress) will return 500 in the
  14 |  * CI environment; we treat that as "auth was applied" and the test still
  15 |  * proves the unauthenticated path returns 401.
  16 |  */
  17 | // See smoke.spec.ts for the rationale: serial execution keeps the in-memory
  18 | // rate limiter from being starved by parallel workers.
  19 | test.describe.configure({ mode: 'serial' });
  20 | 
  21 | test.describe('LeetCast auth flow', () => {
  22 |   test('dev login page is reachable in development', async ({ page }) => {
> 23 |     const response = await page.goto(`${BASE}/login/dev`, { waitUntil: 'domcontentloaded' });
     |                                 ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login/dev
  24 |     expect(response).not.toBeNull();
  25 |     expect(response!.status()).toBeLessThan(500);
  26 |     // The form should render a username field.
  27 |     await expect(page.getByTestId('dev-username')).toBeAttached();
  28 |   });
  29 | 
  30 |   test('POST /api/progress without session returns 401', async ({ request }) => {
  31 |     const response = await request.post(`${BASE}/api/progress`, {
  32 |       data: { podcastId: 'x', progress: 10 },
  33 |     });
  34 |     expect(response.status()).toBe(401);
  35 |   });
  36 | 
  37 |   test('logging in via /login/dev establishes a session', async ({ page }) => {
  38 |     // Walk the dev login flow.
  39 |     await page.goto(`${BASE}/login/dev`);
  40 |     await page.getByTestId('dev-username').fill('e2e-user');
  41 |     await page.getByTestId('dev-submit').click();
  42 | 
  43 |     // After the server action completes we should be on the home page.
  44 |     await page.waitForURL(`${BASE}/`, { timeout: 10_000 });
  45 | 
  46 |     // Reuse the same authenticated context (page.request shares the browser
  47 |     // cookie jar) to verify /api/progress is no longer 401. With no DB it
  48 |     // will 500, but never 401.
  49 |     const cookies = await page.context().cookies();
  50 |     const sessionCookie = cookies.find(
  51 |       (c) => c.name.includes('session') || c.name.includes('auth')
  52 |     );
  53 |     expect(sessionCookie, 'next-auth should have set a session cookie').toBeDefined();
  54 | 
  55 |     const response = await page.request.post(`${BASE}/api/progress`, {
  56 |       data: { podcastId: 'x', progress: 10 },
  57 |     });
  58 |     // 200 / 500 = auth succeeded, request reached the handler.
  59 |     // 401 = auth did NOT succeed.
  60 |     expect([200, 500]).toContain(response.status());
  61 |   });
  62 | 
  63 |   test('clearing the session cookie reverts /api/progress to 401', async ({ page, context }) => {
  64 |     await page.goto(`${BASE}/login/dev`);
  65 |     await page.getByTestId('dev-username').fill('logout-user');
  66 |     await page.getByTestId('dev-submit').click();
  67 |     await page.waitForURL(`${BASE}/`, { timeout: 10_000 });
  68 | 
  69 |     // Confirm we are authenticated.
  70 |     let cookies = await context.cookies();
  71 |     const beforeCookie = cookies.find((c) => c.name.includes('session-token'));
  72 |     expect(beforeCookie, 'session cookie should exist after login').toBeDefined();
  73 | 
  74 |     // Simulate sign-out: clear the session-token cookie via the browser
  75 |     // context. (We do not exercise NextAuth's /api/auth/signout endpoint
  76 |     // because its CSRF handshake is brittle to assert in a smoke test;
  77 |     // this is what the application's `signOut()` server action does
  78 |     // client-side anyway.)
  79 |     await context.clearCookies();
  80 | 
  81 |     cookies = await context.cookies();
  82 |     const afterCookie = cookies.find((c) => c.name.includes('session-token'));
  83 |     expect(afterCookie, 'session cookie should be cleared after logout').toBeUndefined();
  84 | 
  85 |     // Without the session cookie, /api/progress must return 401.
  86 |     const response = await page.request.post(`${BASE}/api/progress`, {
  87 |       data: { podcastId: 'x', progress: 10 },
  88 |     });
  89 |     expect(response.status()).toBe(401);
  90 |   });
  91 | });
  92 | 
```