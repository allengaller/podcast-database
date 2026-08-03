import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * The rate-limit module owns an unref'd setInterval that pings every 5
 * minutes. Vitest's test isolation kills that handle, but importing the
 * module also re-installs Date.now via the live clock. We pin Date.now
 * via vi.useFakeTimers so the window math is deterministic.
 */
describe('rateLimit', () => {
  let NOW = 1_700_000_000_000;
  beforeEach(() => {
    NOW = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // Lazy-import so the module-level setInterval in rate-limit.ts does
    // not interfere with the fake clock. We also need to invalidate the
    // module cache to clear the in-memory `store` map.
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function loadFresh() {
    const mod = await import('@/lib/rate-limit');
    return mod.rateLimit;
  }

  it('allows the first request and reports remaining = max-1', async () => {
    const rateLimit = await loadFresh();
    const result = rateLimit('user-1', { maxRequests: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.retryAfter).toBeUndefined();
  });

  it('counts down the remaining budget across calls', async () => {
    const rateLimit = await loadFresh();
    rateLimit('user-2', { maxRequests: 3, windowMs: 60_000 });
    rateLimit('user-2', { maxRequests: 3, windowMs: 60_000 });
    const last = rateLimit('user-2', { maxRequests: 3, windowMs: 60_000 });
    expect(last.allowed).toBe(true);
    expect(last.remaining).toBe(0);
  });

  it('denies requests past the limit with a retry-after hint', async () => {
    const rateLimit = await loadFresh();
    for (let i = 0; i < 3; i += 1) rateLimit('user-3', { maxRequests: 3, windowMs: 60_000 });
    const rejected = rateLimit('user-3', { maxRequests: 3, windowMs: 60_000 });
    expect(rejected.allowed).toBe(false);
    expect(rejected.remaining).toBe(0);
    expect(rejected.retryAfter).toBeGreaterThan(0);
    expect(rejected.retryAfter).toBeLessThanOrEqual(60);
  });

  it('isolates keys: one user exhausting does not affect another', async () => {
    const rateLimit = await loadFresh();
    for (let i = 0; i < 3; i += 1) rateLimit('user-a', { maxRequests: 3, windowMs: 60_000 });
    const other = rateLimit('user-b', { maxRequests: 3, windowMs: 60_000 });
    expect(other.allowed).toBe(true);
    expect(other.remaining).toBe(2);
  });

  it('resets the budget after the window elapses', async () => {
    const rateLimit = await loadFresh();
    for (let i = 0; i < 3; i += 1) rateLimit('user-c', { maxRequests: 3, windowMs: 1_000 });
    const blocked = rateLimit('user-c', { maxRequests: 3, windowMs: 1_000 });
    expect(blocked.allowed).toBe(false);

    vi.setSystemTime(NOW + 1_500); // advance past 1s window
    const afterReset = rateLimit('user-c', { maxRequests: 3, windowMs: 1_000 });
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(2);
  });
});

import { afterEach } from 'vitest';