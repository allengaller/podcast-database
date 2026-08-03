import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-export the Prisma namespace explicitly. `export * from '@prisma/client'`
// does not always surface named exports like `Prisma` through downstream
// `.d.ts` files, so consumers using `import { Prisma } from '@leetcast/database'`
// would otherwise see TS2724. Naming the symbol directly guarantees the
// re-export survives module resolution across all workspaces.
export { Prisma };
export * from '@prisma/client';
export * from './strategy';
