import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('sentry helpers', () => {
  beforeEach(() => {
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    vi.resetModules();
  });

  it('isSentryEnabled returns false when no DSN is set', async () => {
    const { isSentryEnabled } = await import('@/lib/sentry');
    expect(isSentryEnabled()).toBe(false);
  });

  it('isSentryEnabled returns true when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.test/123';
    const { isSentryEnabled } = await import('@/lib/sentry');
    expect(isSentryEnabled()).toBe(true);
  });

  it('isSentryEnabled returns true when NEXT_PUBLIC_SENTRY_DSN is set', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.test/456';
    const { isSentryEnabled } = await import('@/lib/sentry');
    expect(isSentryEnabled()).toBe(true);
  });

  it('reportError is a no-op when Sentry is disabled', async () => {
    const { reportError } = await import('@/lib/sentry');
    const sentry = await import('@sentry/nextjs');
    expect(() => reportError(new Error('boom'))).not.toThrow();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it('withSentrySpan wraps the function and propagates errors', async () => {
    const { withSentrySpan } = await import('@/lib/sentry');
    const result = await withSentrySpan('TEST', async () => 42);
    expect(result).toBe(42);
  });

  it('withSentrySpan rethrows and reports when Sentry is configured', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.test/789';
    const { withSentrySpan } = await import('@/lib/sentry');
    const sentry = await import('@sentry/nextjs');
    const err = new Error('downstream failure');
    await expect(
      withSentrySpan('TEST', async () => {
        throw err;
      })
    ).rejects.toBe(err);
    expect(sentry.captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ extra: expect.objectContaining({ route: 'TEST' }) })
    );
  });
});