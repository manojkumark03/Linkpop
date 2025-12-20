import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory cache for aggregated stats
const aggregationCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Verify request is from authorized source (cron job or internal call)
function verifyAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // If no secret is configured, allow in development
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyAuthorization(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let profile_ids: string[] | undefined;
    try {
      const body = (await request.json()) as Record<string, unknown>;
      profile_ids = body.profile_ids as string[] | undefined;
    } catch {
      profile_ids = undefined;
    }

    // Get all profiles or specific ones
    const profiles = await prisma.profile.findMany({
      where: profile_ids ? { id: { in: profile_ids } } : {},
      select: { id: true },
    });

    const aggregatedStats: Record<
      string,
      {
        profileId: string;
        totalClicks: number;
        clicks7d: number;
        clicks30d: number;
        topCountries: Array<{ country: string; count: number }>;
        topDevices: Array<{ device: string; count: number }>;
      }
    > = {};

    // Aggregate stats for each profile
    for (const profile of profiles) {
      const cacheKey = `profile-${profile.id}`;
      const cached = aggregationCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        aggregatedStats[profile.id] = cached.data as (typeof aggregatedStats)[string];
        continue;
      }

      const now = new Date();
      const date7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const date30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [totalClicks, clicks7d, clicks30d, topCountries, topDevices] = await Promise.all([
        prisma.analytics.count({
          where: { link: { profileId: profile.id } },
        }),
        prisma.analytics.count({
          where: {
            link: { profileId: profile.id },
            clickedAt: { gte: date7d },
          },
        }),
        prisma.analytics.count({
          where: {
            link: { profileId: profile.id },
            clickedAt: { gte: date30d },
          },
        }),
        prisma.analytics.groupBy({
          by: ['country'],
          where: { link: { profileId: profile.id } },
          _count: true,
          orderBy: { _count: { country: 'desc' } },
          take: 5,
        }),
        prisma.analytics.groupBy({
          by: ['deviceType'],
          where: { link: { profileId: profile.id } },
          _count: true,
        }),
      ]);

      const stats = {
        profileId: profile.id,
        totalClicks,
        clicks7d,
        clicks30d,
        topCountries: topCountries.map((item) => ({
          country: item.country || 'Unknown',
          count: item._count,
        })),
        topDevices: topDevices.map((item) => ({
          device: item.deviceType,
          count: item._count,
        })),
      };

      aggregatedStats[profile.id] = stats;
      aggregationCache.set(cacheKey, { data: stats, timestamp: Date.now() });
    }

    return NextResponse.json({
      success: true,
      profileCount: profiles.length,
      stats: aggregatedStats,
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAuthorization(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    const cacheKey = `profile-${profileId}`;
    const cached = aggregationCache.get(cacheKey);

    if (cached) {
      const cacheData = cached.data as Record<string, unknown>;
      return NextResponse.json({
        profileId,
        cached: true,
        timestamp: cached.timestamp,
        ...cacheData,
      });
    }

    // Not cached, return empty stats
    return NextResponse.json({
      profileId,
      cached: false,
      message: 'No cached stats available. Run aggregation first.',
    });
  } catch (error) {
    console.error('Cache lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
