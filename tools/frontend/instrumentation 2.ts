// Next.js 14 requires this file for early Sentry initialization.
// We forward to the server config so that Sentry is wired up before any
// request handler runs in the Node.js runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.server.config');
  }
}
