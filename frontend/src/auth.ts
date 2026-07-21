import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@leetcast/database';

const isDev = process.env.NODE_ENV !== 'production';
const hasDatabase = Boolean(process.env.DATABASE_URL);

/**
 * The Credentials provider below is **dev/E2E only**. It accepts any
 * non-empty username and provisions a stub user that the Playwright suite
 * uses to exercise authenticated routes without a real GitHub OAuth flow.
 *
 * It is gated behind `NODE_ENV !== 'production'` so it is impossible to
 * reach in a deployed environment, even by accident.
 */
const devProviders = isDev
  ? [
      Credentials({
        id: 'dev',
        name: 'Development login (E2E only)',
        credentials: {
          username: { label: 'Username', type: 'text' },
        },
        async authorize(credentials) {
          const username = String(credentials?.username ?? '').trim();
          if (!username) return null;
          // Stable dev user id so E2E can reference it.
          return {
            id: `dev-${username}`,
            name: username,
            email: `${username}@dev.local`,
            image: null,
          };
        },
      }),
    ]
  : [];

// When DATABASE_URL is unset (e.g. local smoke runs before docker compose
// is up) we fall back to a JWT-only session strategy so NextAuth still
// works for E2E. The PrismaAdapter is only attached when we actually have
// a reachable database.
const config = hasDatabase
  ? {
      adapter: PrismaAdapter(prisma),
      session: { strategy: 'database' as const },
    }
  : {
      session: { strategy: 'jwt' as const },
    };

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...config,
  // NextAuth v5 in production refuses requests whose Host header is not
  // on a trusted list. In Vercel this is auto-populated; locally it is not.
  // We default to trusting the host (matches the behavior in development
  // and is what Vercel deployments get for free). Tighten this in
  // production by setting AUTH_TRUST_HOST=false and configuring
  // `trustHost` explicitly per environment.
  trustHost: process.env.AUTH_TRUST_HOST !== 'false',
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? 'unset',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? 'unset',
    }),
    ...devProviders,
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session: async ({ session, user, token }) => {
      if (session.user) {
        // database strategy → `user` is set; jwt strategy → id lives in token.sub
        if (user?.id) session.user.id = user.id;
        else if (token?.sub) session.user.id = token.sub;
      }
      return session;
    },
  },
});
