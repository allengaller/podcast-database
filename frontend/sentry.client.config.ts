// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    debug: false,
    // Don't send PII; this is a learning app and user emails are not actionable here.
    sendDefaultPii: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
  });
}
