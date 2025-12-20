import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import {
  createMockRequest,
  createTestUser,
  cleanupTestUser,
  cleanupPasswordResetTokens,
  prisma,
} from '@/test/helpers';

describe('POST /api/auth/password-reset/request', () => {
  const testEmail = 'reset-test@example.com';
  const testPassword = 'Password123';

  beforeEach(async () => {
    await cleanupTestUser(testEmail);
  });

  afterEach(async () => {
    await cleanupTestUser(testEmail);
  });

  it('should create a password reset token for existing user', async () => {
    const user = await createTestUser(testEmail, testPassword);

    const request = createMockRequest('http://localhost:3000/api/auth/password-reset/request', {
      method: 'POST',
      body: { email: testEmail },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('password reset link has been sent');

    const token = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
    });

    expect(token).not.toBeNull();
    expect(token?.expires.getTime()).toBeGreaterThan(Date.now());

    await cleanupPasswordResetTokens(user.id);
  });

  it('should return success even for non-existent email', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/password-reset/request', {
      method: 'POST',
      body: { email: 'nonexistent@example.com' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('password reset link has been sent');
  });

  it('should reject request for suspended account', async () => {
    const user = await createTestUser(testEmail, testPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'DISABLED' },
    });

    const request = createMockRequest('http://localhost:3000/api/auth/password-reset/request', {
      method: 'POST',
      body: { email: testEmail },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Account is suspended');
  });

  it('should replace old token with new one', async () => {
    const user = await createTestUser(testEmail, testPassword);

    const firstRequest = createMockRequest(
      'http://localhost:3000/api/auth/password-reset/request',
      {
        method: 'POST',
        body: { email: testEmail },
      },
    );

    await POST(firstRequest);

    const firstTokens = await prisma.passwordResetToken.findMany({
      where: { userId: user.id },
    });

    expect(firstTokens.length).toBe(1);
    const firstToken = firstTokens[0].token;

    const secondRequest = createMockRequest(
      'http://localhost:3000/api/auth/password-reset/request',
      {
        method: 'POST',
        body: { email: testEmail },
      },
    );

    await POST(secondRequest);

    const secondTokens = await prisma.passwordResetToken.findMany({
      where: { userId: user.id },
    });

    expect(secondTokens.length).toBe(1);
    expect(secondTokens[0].token).not.toBe(firstToken);

    await cleanupPasswordResetTokens(user.id);
  });
});
