import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl } from './secrets';

let prisma: PrismaClient;

/**
 * Initialize Prisma client. Resolves DATABASE_URL from Secrets Manager
 * if running in AWS (the CDK passes a placeholder that needs resolution).
 * Call this once during app startup (in buildApp).
 */
export async function initPrisma(): Promise<PrismaClient> {
  if (!prisma) {
    // Resolve DATABASE_URL from Secrets Manager if running in AWS
    await resolveDatabaseUrl();

    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

/**
 * Get the Prisma client. Must call initPrisma() first (done in buildApp).
 * This synchronous getter is used throughout all service files.
 */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    // Fallback for localdev: create without async resolution
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}
