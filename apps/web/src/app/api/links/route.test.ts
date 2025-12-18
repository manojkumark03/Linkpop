import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as CreateLink, GET as ListLinks } from './route';
import { GET as ClickLink } from './[linkId]/click/route';
import { createMockRequest, createTestUser, cleanupTestUser, prisma } from '@/test/helpers';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth/next';

describe('links api', () => {
  const email = 'links-api@example.com';
  const password = 'Password123';

  beforeEach(async () => {
    await cleanupTestUser(email);
  });

  afterEach(async () => {
    await cleanupTestUser(email);
  });

  it('creates and lists links for a profile', async () => {
    const user = await createTestUser(email, password);

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        slug: 'links-profile',
        displayName: 'Links Profile',
      },
    });

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

    const createReq = createMockRequest('http://localhost:3000/api/links', {
      method: 'POST',
      body: { profileId: profile.id, title: 'Example', url: 'https://example.com' },
    });

    const createRes = await CreateLink(createReq);
    const createData = await createRes.json();

    expect(createRes.status).toBe(201);
    expect(createData.link.title).toBe('Example');

    const listReq = createMockRequest(`http://localhost:3000/api/links?profileId=${profile.id}`);
    const listRes = await ListLinks(listReq);
    const listData = await listRes.json();

    expect(listRes.status).toBe(200);
    expect(listData.links.length).toBe(1);

    await prisma.link.deleteMany({ where: { profileId: profile.id } });
    await prisma.profile.delete({ where: { id: profile.id } });
  });

  it('tracks a click and redirects', async () => {
    const user = await createTestUser(email, password);

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        slug: 'click-profile',
        displayName: 'Click Profile',
      },
    });

    const link = await prisma.link.create({
      data: {
        profileId: profile.id,
        slug: 'example',
        title: 'Example',
        url: 'https://example.com',
        position: 0,
        status: 'ACTIVE',
        metadata: {},
      },
    });

    const clickReq = createMockRequest(`http://localhost:3000/api/links/${link.id}/click`, {
      headers: { referer: 'https://referrer.example.com', 'user-agent': 'Mozilla/5.0' },
    });

    const clickRes = await ClickLink(clickReq, { params: { linkId: link.id } });

    expect([302, 303, 307, 308]).toContain(clickRes.status);
    expect(clickRes.headers.get('location')).toBe('https://example.com');

    const count = await prisma.analytics.count({ where: { linkId: link.id } });
    expect(count).toBe(1);

    await prisma.analytics.deleteMany({ where: { linkId: link.id } });
    await prisma.link.delete({ where: { id: link.id } });
    await prisma.profile.delete({ where: { id: profile.id } });
  });
});
