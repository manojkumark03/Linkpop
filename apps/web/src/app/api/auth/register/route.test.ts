import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { createMockRequest, cleanupTestUser, prisma } from '@/test/helpers';

describe('POST /api/auth/register', () => {
  const testEmail = 'register-test@example.com';

  beforeEach(async () => {
    await cleanupTestUser(testEmail);
  });

  afterEach(async () => {
    await cleanupTestUser(testEmail);
  });

  it('should register a new user successfully', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test User',
        email: testEmail,
        password: 'Password123',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('User created successfully');
    expect(data.user.email).toBe(testEmail);

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    expect(user).not.toBeNull();
    expect(user?.password).toBeTruthy();
    expect(user?.password).not.toBe('Password123');
  });

  it('should reject registration with existing email', async () => {
    await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Existing User',
      },
    });

    const request = createMockRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test User',
        email: testEmail,
        password: 'Password123',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User already exists');
  });

  it('should reject registration with invalid data', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: {
        name: 'T',
        email: 'invalid-email',
        password: 'weak',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject password without uppercase', async () => {
    const request = createMockRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test User',
        email: testEmail,
        password: 'password123',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });
});
