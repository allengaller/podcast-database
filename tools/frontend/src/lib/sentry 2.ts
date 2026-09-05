/**
 * Helpers that report errors to Sentry *only* when Sentry is configured.
 * Centralizing the guard means feature code does not need to repeat the
 * `if (process.env.SENTRY_DSN)` check.
 */
import * as Sentry from '@sentry/nextjs';

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function reportError(err: unknown, context?: Record<string, unknown>): void {
  if (!isSentryEnabled()) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export function reportMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!isSentryEnabled()) return;
  Sentry.captureMessage(message, level);
}

/**
 * Wrap an API route handler so each request gets a Sentry span named after
 * the route. Errors propagate to the caller and are also reported to Sentry
 * with the route as context. When Sentry is disabled this is a transparent
 * no-op (besides propagating errors normally).
 */
export function withSentrySpan<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  if (!isSentryEnabled()) {
    return fn().catch((err) => {
      reportError(err, { route: name, ...context });
      throw err;
    });
  }
  return Sentry.startSpan({ name, op: 'http.server' }, async () => {
    try {
      return await fn();
    } catch (err) {
      reportError(err, { route: name, ...context });
      throw err;
    }
  });
}
