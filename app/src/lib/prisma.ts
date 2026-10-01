/**
 * Metro Cardz — Prisma Client Singleton
 *
 * Next.js hot-reloads in development, which would create a new PrismaClient
 * on every module reload and exhaust MySQL connection pool quickly.
 * Using a global singleton prevents this while keeping TypeScript happy.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
