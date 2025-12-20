import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = process.env['DATABASE_URL'];

const prismaClient =
  globalForPrisma.prisma ??
  (databaseUrl
    ? new PrismaClient({
        errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
      })
    : null);

export const prisma: PrismaClient =
  prismaClient ??
  (new Proxy(
    {},
    {
      get() {
        throw new Error('DATABASE_URL is not set. Please add it to your .env file.');
      },
    },
  ) as PrismaClient);

if (process.env.NODE_ENV !== 'production' && prismaClient) globalForPrisma.prisma = prismaClient;
