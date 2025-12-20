import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { POST } from './route';
import { createMockRequest, createTestUser, cleanupTestUser, prisma } from '@/test/helpers';

describe('POST /api/auth/password-reset/reset', () => {
  const testEmail = 'reset-password-test@example.com';
  const testPassword = 'OldPassword123';
  const newPassword = 'NewPassword456';

  beforeEach(async () => {
    await cleanupTestUser(testEmail);
  });

  afterEach(async () => {
    await cleanupTestUser(testEmail);
  });

  it('should reset password with valid token', async () => {
    const user = await createTestUser(testEmail, testPassword);

    const token = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: 'valid-test-token',
        expires: new Date(Date.now() + 3600000),
      },
    });

    const request = createMockRequest('http://localhost:3000/api/auth/password-reset/reset', {
      method: 'POST',
      body: {
        token: token.token,
        password: newPassword,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Password reset successfully');

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(updatedUser).not.toBeNull();
    const isValidPassword = await bcrypt.compare(newPassword, updatedUser!.password!);
    expect(isValidPassword).toBe(true);

    const tokenExists = await prisma.passwordResetToken.findUnique({
      where: { token: token.token },
    });
    expect(tokenExists).toBeNull();
  });

  it('should reject invalid token', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/password-reset/reset', {
      method: 'POST',
      body: {
        token: 'invalid-token',
        password: newPassword,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid or expired token');
  });

  it('should reject expired token', async () => {
    const user = await createTestUser(testEmail, testPassword);

    const token = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: 'expired-token',
        expires: new Date(Date.now() - 3600000),
      },
    });

    const request = createMockRequest('http://localhost:3000/api/auth/password-reset/reset', {
      method: 'POST',
      body: {
        token: token.token,
        password: newPassword,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token has expired');

    const tokenExists = await prisma.passwordResetToken.findUnique({
      where: { token: token.token },
    });
    expect(tokenExists).toBeNull();
  });

  it('should reject weak password', async () => {
    const user = await createTestUser(testEmail, testPassword);

    const token = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: 'valid-token-weak-pass',
        expires: new Date(Date.now() + 3600000),
      },
    });

    const request = createMockRequest('http://localhost:3000/api/auth/password-reset/reset', {
      method: 'POST',
      body: {
        token: token.token,
        password: 'weak',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');

    await prisma.passwordResetToken.delete({
      where: { id: token.id },
    });
  });

  it('should reject reset for suspended account', async () => {
    const user = await createTestUser(testEmail, testPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'DISABLED' },
    });

    const token = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: 'valid-token-suspended',
        expires: new Date(Date.now() + 3600000),
      },
    });

    const request = createMockRequest('http://localhost:3000/api/auth/password-reset/reset', {
      method: 'POST',
      body: {
        token: token.token,
        password: newPassword,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Account is suspended');

    await prisma.passwordResetToken.delete({
      where: { id: token.id },
    });
  });
});
