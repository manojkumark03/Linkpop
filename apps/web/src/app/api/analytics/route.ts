import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectDeviceType } from '@/lib/device-detect';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkId, referrer } = body;

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { id: true },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Get device type from user agent
    const userAgent = request.headers.get('user-agent');
    const deviceType = detectDeviceType(userAgent);

    // Get country from header (set by Vercel edge middleware or similar)
    const country =
      request.headers.get('cloudflare-ipcountry') ||
      request.headers.get('x-vercel-ip-country') ||
      'US';

    const analytics = await prisma.analytics.create({
      data: {
        linkId,
        referrer: referrer || request.headers.get('referer') || null,
        deviceType,
        userAgent: userAgent || null,
        country: country && country.length === 2 ? country : 'US',
      },
    });

    return NextResponse.json({ id: analytics.id, success: true }, { status: 201 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');
    const days = parseInt(searchParams.get('days') || '7', 10);

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { id: true, profileId: true },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, byCountry, byDevice, byReferrer, byDay] = await Promise.all([
      prisma.analytics.count({
        where: {
          linkId,
          clickedAt: { gte: startDate },
        },
      }),
      prisma.analytics.groupBy({
        by: ['country'],
        where: {
          linkId,
          clickedAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
      prisma.analytics.groupBy({
        by: ['deviceType'],
        where: {
          linkId,
          clickedAt: { gte: startDate },
        },
        _count: true,
      }),
      prisma.analytics.groupBy({
        by: ['referrer'],
        where: {
          linkId,
          clickedAt: { gte: startDate },
          referrer: { not: null },
        },
        _count: true,
        orderBy: { _count: { referrer: 'desc' } },
        take: 10,
      }),
      prisma.analytics.groupBy({
        by: ['clickedAt'],
        where: {
          linkId,
          clickedAt: { gte: startDate },
        },
        _count: true,
        orderBy: { clickedAt: 'asc' },
      }),
    ]);

    return NextResponse.json({
      linkId,
      days,
      total,
      byCountry: byCountry.map((item) => ({
        country: item.country || 'Unknown',
        count: item._count,
      })),
      byDevice: byDevice.map((item) => ({
        device: item.deviceType,
        count: item._count,
      })),
      byReferrer: byReferrer.map((item) => ({
        referrer: item.referrer || 'Direct',
        count: item._count,
      })),
      byDay: byDay.map((item) => ({
        date: item.clickedAt,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
