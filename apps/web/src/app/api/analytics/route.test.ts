import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('/api/analytics', () => {
  let testLink: { id: string };
  let testProfile: { id: string; userId: string };
  let testUser: { id: string };

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `test-analytics-${Date.now()}@example.com`,
        name: 'Analytics Test User',
        password: 'hashedpassword',
      },
    });

    // Create test profile
    testProfile = await prisma.profile.create({
      data: {
        userId: testUser.id,
        slug: `test-analytics-${Date.now()}`,
      },
    });

    // Create test link
    testLink = await prisma.link.create({
      data: {
        profileId: testProfile.id,
        slug: 'test-link',
        title: 'Test Link',
        url: 'https://example.com',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.analytics.deleteMany({
      where: { linkId: testLink.id },
    });
    await prisma.link.deleteMany({
      where: { profileId: testProfile.id },
    });
    await prisma.profile.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });

  it('should track analytics on POST', async () => {
    const response = await fetch('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkId: testLink.id,
        referrer: 'https://twitter.com',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.success).toBe(true);
  });

  it('should return 400 if linkId is missing', async () => {
    const response = await fetch('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: 'https://twitter.com',
      }),
    });

    expect(response.status).toBe(400);
  });

  it('should return 404 if link not found', async () => {
    const response = await fetch('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkId: 'nonexistent-link',
      }),
    });

    expect(response.status).toBe(404);
  });

  it('should get analytics on GET', async () => {
    // First, create a few analytics records
    await prisma.analytics.createMany({
      data: [
        {
          linkId: testLink.id,
          country: 'US',
          deviceType: 'DESKTOP',
          referrer: 'https://google.com',
        },
        {
          linkId: testLink.id,
          country: 'UK',
          deviceType: 'MOBILE',
          referrer: 'https://twitter.com',
        },
      ],
    });

    const response = await fetch(
      `http://localhost:3000/api/analytics?linkId=${testLink.id}&days=7`,
      {
        method: 'GET',
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.linkId).toBe(testLink.id);
    expect(data.total).toBeGreaterThanOrEqual(2);
    expect(data.byCountry).toBeDefined();
    expect(data.byDevice).toBeDefined();
    expect(data.byReferrer).toBeDefined();
    expect(data.byDay).toBeDefined();
  });

  it('should return 400 if linkId is missing on GET', async () => {
    const response = await fetch('http://localhost:3000/api/analytics', {
      method: 'GET',
    });

    expect(response.status).toBe(400);
  });
});
