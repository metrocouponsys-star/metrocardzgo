/**
 * Metro Cardz — Prisma Client Singleton & Resilient Transaction Manager
 *
 * Next.js hot-reloads in development, which would create a new PrismaClient
 * on every module reload and exhaust MySQL connection pool quickly.
 * Using a global singleton prevents this while keeping TypeScript happy.
 *
 * Includes automatic retry for transient MySQL connection drops (wait_timeout)
 * and transaction deadlocks (MySQL 1213 / Prisma P2034) commonly seen on mobile devices.
 */
import { PrismaClient, Prisma } from '@prisma/client';

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

// Always cache the singleton — prevents connection pool exhaustion in production
globalForPrisma.prisma = prisma;

export type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface TransactionOptions {
  maxRetries?: number;
  timeout?: number;  // ms allowed for entire transaction (default: 15000ms)
  maxWait?: number;  // ms to wait to acquire connection from pool (default: 10000ms)
}

/**
 * Executes a Prisma interactive transaction with exponential backoff retry.
 * Handles:
 *  - MySQL wait_timeout idle socket drops (ECONNRESET, P1001)
 *  - Concurrent write deadlocks (MySQL 1213 / P2034)
 *  - Pool acquisition delays under mobile traffic bursts (P2024)
 */
export async function runTransactionWithRetry<T>(
  action: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const { maxRetries = 3, timeout = 15000, maxWait = 10000 } = options;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(action, { maxWait, timeout });
    } catch (err: any) {
      lastError = err;
      const isRetryable =
        err?.code === 'P2034' || // Deadlock / write conflict
        err?.code === 'P2024' || // Connection pool timeout
        err?.code === 'P1001' || // Database unreachable / socket closed
        err?.code === 'P2028' || // Transaction API error
        err?.message?.includes('Deadlock') ||
        err?.message?.includes('closed') ||
        err?.message?.includes('Connection lost') ||
        err?.message?.includes('ECONNRESET');

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      // If connection was dropped, attempt a graceful pool reset
      if (err?.code === 'P1001' || err?.message?.includes('closed') || err?.message?.includes('ECONNRESET')) {
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch {
          // ignore reconnect error in loop, retry block will re-attempt
        }
      }

      // Jittered backoff (50ms - 300ms)
      const delay = Math.min(50 * Math.pow(2, attempt) + Math.random() * 50, 600);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastError;
}

export default prisma;
