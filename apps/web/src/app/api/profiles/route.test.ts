import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';
import { createMockRequest, createTestUser, cleanupTestUser, prisma } from '@/test/helpers';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth/next';

describe('profiles api', () => {
  const email = 'profiles-api@example.com';
  const password = 'Password123';

  beforeEach(async () => {
    await cleanupTestUser(email);
  });

  afterEach(async () => {
    await cleanupTestUser(email);
  });

  it('creates and lists profiles for the authenticated user', async () => {
    const user = await createTestUser(email, password);

    (getServerSession as any).mockResolvedValue({
      user: {
        id: user.id,
        email: user.email!,
        name: user.name!,
        image: user.image ?? '',
        role: user.role,
        status: user.status,
      },
    });

    const createReq = createMockRequest('http://localhost:3000/api/profiles', {
      method: 'POST',
      body: { slug: 'test-profile', displayName: 'Test Profile' },
    });

    const createRes = await POST(createReq);
    const createData = await createRes.json();

    expect(createRes.status).toBe(201);
    expect(createData.profile.slug).toBe('test-profile');

    const listRes = await GET();
    const listData = await listRes.json();

    expect(listRes.status).toBe(200);
    expect(listData.profiles.length).toBeGreaterThanOrEqual(1);

    await prisma.profile.deleteMany({ where: { userId: user.id } });
  });
});
