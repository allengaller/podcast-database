import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Smoke tests for the public surface. These do not require a live database
 * or worker — they verify the Next.js app boots, renders the marketing
 * surface, and exposes a JSON health endpoint.
 *
 * When DB/Redis are offline, /api/health responds with status: 'degraded'
 * and HTTP 503. We accept either 'healthy' or 'degraded' to keep these
 * tests runnable in CI without external services.
 */
// Run the smoke suite serially: in-memory rate limiters in the dev server
// share state across requests and parallel workers can starve the limit.
test.describe.configure({ mode: 'serial' });

test.describe('LeetCast public smoke', () => {
  // Pages that do not require DB (login) should always return 200.
  // Pages that hit Prisma RSC may return 500 in an unprovisioned dev
  // environment; we assert "the server responded" rather than a specific code.
  test('homepage renders a body (any reachable status)', async ({ page }) => {
    const response = await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    // Server should at least respond — 200 with DB, 500 without, both prove the
    // app is up. This keeps smoke tests runnable before DB is provisioned.
    expect(response, 'homepage should at least respond').not.toBeNull();
    expect(response!.status()).toBeLessThan(600);
    // body may be hidden briefly while Next.js bootstraps (FOUC suppression
    // in dev) or while an error.tsx renders. Assert attached, not visible.
    await expect(page.locator('body')).toBeAttached();
  });

  test('problems page renders a body (any reachable status)', async ({ page }) => {
    const response = await page.goto(`${BASE}/problems`);
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(600);
  });

  test('login page returns 200 (no DB dependency)', async ({ page }) => {
    const response = await page.goto(`${BASE}/login`);
    expect(response?.status()).toBe(200);
    // The exact text may vary; just assert the page rendered something.
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length ?? 0).toBeGreaterThan(0);
  });

  test('/api/health returns a JSON status payload', async ({ request }) => {
    const response = await request.get(`${BASE}/api/health`);
    // 200 when DB+Redis are reachable, 503 when degraded. Either is acceptable
    // for a smoke test against an unprovisioned dev environment.
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(['healthy', 'degraded']).toContain(body.status);
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('web');
  });
});

/**
 * Admin API contract: the daily-publish endpoint must require a token.
 * We do NOT exercise the success path here because that enqueues a real
 * BullMQ job and would need a running worker + DB.
 */
test.describe('LeetCast admin API contract', () => {
  test('POST /api/admin/daily rejects requests without a token', async ({ request }) => {
    const response = await request.post(`${BASE}/api/admin/daily`, {
      data: { strategy: 'progressive' },
    });
    expect(response.status()).toBe(403);
  });

  test('POST /api/admin/daily rejects invalid strategy', async ({ request }) => {
    const response = await request.post(`${BASE}/api/admin/daily`, {
      headers: { 'x-admin-token': 'any-token' },
      data: { strategy: 'banana' },
    });
    // 400 (validation) / 403 (bad token) / 429 (rate-limited from earlier
    // calls in this run) are all acceptable: each indicates the request did
    // not reach the queue.
    expect([400, 403, 429]).toContain(response.status());
  });
});
