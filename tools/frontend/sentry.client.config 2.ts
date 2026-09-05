// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    // 10% of page loads get full tracing. Tune via env in production.
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    // Long tasks and slow frames on a sampled subset; helps catch UI hangs.
    profilesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? '0.1'),
    debug: false,
    // Don't send PII; this is a learning app and user emails are not actionable here.
    sendDefaultPii: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    // Strip LeetCode problem IDs and our own auth cookie from breadcrumbs.
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'fetch' && breadcrumb.data?.url) {
        try {
          const u = new URL(breadcrumb.data.url);
          if (u.pathname.startsWith('/api/')) {
            breadcrumb.data.url = `${u.origin}${u.pathname}`;
          }
        } catch {
          /* ignore non-URLs */
        }
      }
      return breadcrumb;
    },
  });
}
