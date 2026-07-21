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
