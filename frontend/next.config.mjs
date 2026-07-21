import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      // Allow Sentry ingest when SENTRY_DSN is set; otherwise this is harmless.
      "connect-src 'self' https:",
      "media-src 'self' https:",
    ].join('; '),
  },
];

const nextConfig = {
  transpilePackages: ['@leetcast/core', '@leetcast/database'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-admin-token' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};

// Wrap with Sentry only when a DSN is provided. This keeps local builds
// working without Sentry and avoids forcing the plugin to run in CI unless
// we have credentials.
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryDsn
  ? withSentryConfig(nextConfig, {
      // Disable telemetry on Sentry's side too (we are not using Sentry's
      // release health / session replay upload in CI to keep builds lean).
      silent: !process.env.CI,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disableLogger: true,
      // Don't block builds when source-map upload is unavailable.
      widenClientFileUpload: true,
      hideSourceMaps: true,
    })
  : nextConfig;

