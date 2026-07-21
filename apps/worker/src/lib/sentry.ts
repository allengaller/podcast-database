/**
 * Worker-side Sentry helpers. All exports are no-ops when SENTRY_DSN is not
 * configured, so production deployments that have not opted into Sentry keep
 * working without code changes.
 */
import * as Sentry from '@sentry/node';

let initialized = false;

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN);
}

export function initSentry(): void {
  if (initialized || !isSentryEnabled()) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    sendDefaultPii: false,
  });
  initialized = true;
}

export function reportError(err: unknown, context?: Record<string, unknown>): void {
  if (!isSentryEnabled()) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export async function withSentry<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  initSentry();
  if (!isSentryEnabled()) return fn();
  return await Sentry.startSpan({ name, op: 'worker.job' }, async () => {
    try {
      return await fn();
    } catch (err) {
      reportError(err, context);
      throw err;
    }
  });
}
