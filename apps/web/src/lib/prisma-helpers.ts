import type { Prisma, PrismaClient } from '@prisma/client';

import { prisma } from './prisma';

export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export type PageInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function getSkipTake(input: PaginationInput): {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
} {
  const pageSize = Math.max(1, Math.min(100, input.pageSize ?? 20));
  const page = Math.max(1, input.page ?? 1);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export async function paginate<T>(options: {
  pagination: PaginationInput;
  query: (paginationArgs: { skip: number; take: number }) => Promise<T[]>;
  count: () => Promise<number>;
}): Promise<{ data: T[]; pageInfo: PageInfo }> {
  const { skip, take, page, pageSize } = getSkipTake(options.pagination);

  const [data, total] = await Promise.all([options.query({ skip, take }), options.count()]);

  return {
    data,
    pageInfo: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export type DbClient = PrismaClient | Prisma.TransactionClient;

export type InteractiveTransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: InteractiveTransactionOptions,
): Promise<T> {
  return prisma.$transaction((tx) => fn(tx), options);
}

export async function transactionalWrites<T>(operations: Prisma.PrismaPromise<T>[]): Promise<T[]> {
  return prisma.$transaction(operations);
}
