export { auth as middleware } from '@/auth';

export const config = {
  // Skip middleware on static assets, API routes, and the public login
  // surface (including the dev-only /login/dev form). The auth() call in
  // middleware would otherwise attempt to spin up PrismaAdapter at the
  // edge, which crashes the smoke tests when no DB is available.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|login/dev).*)'],
};
