import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createTestUser(
  email: string,
  password: string,
  role: 'USER' | 'ADMIN' = 'USER',
) {
  const hashedPassword = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      email,
      name: 'Test User',
      password: hashedPassword,
      role,
    },
  });
}

export async function cleanupTestUser(email: string) {
  await prisma.user.deleteMany({
    where: { email },
  });
}

export async function cleanupPasswordResetTokens(userId: string) {
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });
}

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {},
): Request {
  const { method = 'GET', body, headers = {} } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export { prisma };
