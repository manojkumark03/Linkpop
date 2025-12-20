import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createMissingDatabaseUrlProxy(): PrismaClient {
  return new Proxy(
    {},
    {
      get() {
        throw new Error('DATABASE_URL is not set. Please add it to your .env file.');
      },
    },
  ) as unknown as PrismaClient;
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL
    ? new PrismaClient({
        errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
      })
    : createMissingDatabaseUrlProxy());

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma;
}
