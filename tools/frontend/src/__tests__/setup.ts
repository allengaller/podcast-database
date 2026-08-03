/**
 * Vitest setup. Runs before every test file.
 *
 * - Disables the in-process rate-limit cleanup interval by re-importing the
 *   module after Date is mocked in tests that need deterministic timing.
 * - Stubs Sentry so `withSentrySpan` does not require a real DSN.
 * - Sets CI-ish defaults for env-dependent modules.
 */
import { vi, beforeEach, afterEach } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  startSpan: (_opts: unknown, fn: () => unknown) => fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// Ensure auth-related env defaults don't leak between tests.
beforeEach(() => {
  process.env.AUTH_SECRET ??= 'test-secret';
  delete process.env.SENTRY_DSN;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
});

afterEach(() => {
  vi.clearAllMocks();
});