# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend/e2e/smoke.spec.ts >> LeetCast public smoke >> homepage renders a body (any reachable status)
- Location: frontend/e2e/smoke.spec.ts:22:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE = process.env.BASE_URL || 'http://localhost:3000';
  4  | 
  5  | /**
  6  |  * Smoke tests for the public surface. These do not require a live database
  7  |  * or worker — they verify the Next.js app boots, renders the marketing
  8  |  * surface, and exposes a JSON health endpoint.
  9  |  *
  10 |  * When DB/Redis are offline, /api/health responds with status: 'degraded'
  11 |  * and HTTP 503. We accept either 'healthy' or 'degraded' to keep these
  12 |  * tests runnable in CI without external services.
  13 |  */
  14 | // Run the smoke suite serially: in-memory rate limiters in the dev server
  15 | // share state across requests and parallel workers can starve the limit.
  16 | test.describe.configure({ mode: 'serial' });
  17 | 
  18 | test.describe('LeetCast public smoke', () => {
  19 |   // Pages that do not require DB (login) should always return 200.
  20 |   // Pages that hit Prisma RSC may return 500 in an unprovisioned dev
  21 |   // environment; we assert "the server responded" rather than a specific code.
  22 |   test('homepage renders a body (any reachable status)', async ({ page }) => {
> 23 |     const response = await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
     |                                 ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  24 |     // Server should at least respond — 200 with DB, 500 without, both prove the
  25 |     // app is up. This keeps smoke tests runnable before DB is provisioned.
  26 |     expect(response, 'homepage should at least respond').not.toBeNull();
  27 |     expect(response!.status()).toBeLessThan(600);
  28 |     // body may be hidden briefly while Next.js bootstraps (FOUC suppression
  29 |     // in dev) or while an error.tsx renders. Assert attached, not visible.
  30 |     await expect(page.locator('body')).toBeAttached();
  31 |   });
  32 | 
  33 |   test('problems page renders a body (any reachable status)', async ({ page }) => {
  34 |     const response = await page.goto(`${BASE}/problems`);
  35 |     expect(response).not.toBeNull();
  36 |     expect(response!.status()).toBeLessThan(600);
  37 |   });
  38 | 
  39 |   test('login page returns 200 (no DB dependency)', async ({ page }) => {
  40 |     const response = await page.goto(`${BASE}/login`);
  41 |     expect(response?.status()).toBe(200);
  42 |     // The exact text may vary; just assert the page rendered something.
  43 |     const bodyText = await page.locator('body').textContent();
  44 |     expect(bodyText?.length ?? 0).toBeGreaterThan(0);
  45 |   });
  46 | 
  47 |   test('/api/health returns a JSON status payload', async ({ request }) => {
  48 |     const response = await request.get(`${BASE}/api/health`);
  49 |     // 200 when DB+Redis are reachable, 503 when degraded. Either is acceptable
  50 |     // for a smoke test against an unprovisioned dev environment.
  51 |     expect([200, 503]).toContain(response.status());
  52 |     const body = await response.json();
  53 |     expect(body).toHaveProperty('status');
  54 |     expect(['healthy', 'degraded']).toContain(body.status);
  55 |     expect(body).toHaveProperty('checks');
  56 |     expect(body.checks).toHaveProperty('web');
  57 |   });
  58 | });
  59 | 
  60 | /**
  61 |  * Admin API contract: the daily-publish endpoint must require a token.
  62 |  * We do NOT exercise the success path here because that enqueues a real
  63 |  * BullMQ job and would need a running worker + DB.
  64 |  */
  65 | test.describe('LeetCast admin API contract', () => {
  66 |   test('POST /api/admin/daily rejects requests without a token', async ({ request }) => {
  67 |     const response = await request.post(`${BASE}/api/admin/daily`, {
  68 |       data: { strategy: 'progressive' },
  69 |     });
  70 |     expect(response.status()).toBe(403);
  71 |   });
  72 | 
  73 |   test('POST /api/admin/daily rejects invalid strategy', async ({ request }) => {
  74 |     const response = await request.post(`${BASE}/api/admin/daily`, {
  75 |       headers: { 'x-admin-token': 'any-token' },
  76 |       data: { strategy: 'banana' },
  77 |     });
  78 |     // 400 (validation) / 403 (bad token) / 429 (rate-limited from earlier
  79 |     // calls in this run) are all acceptable: each indicates the request did
  80 |     // not reach the queue.
  81 |     expect([400, 403, 429]).toContain(response.status());
  82 |   });
  83 | });
  84 | 
```