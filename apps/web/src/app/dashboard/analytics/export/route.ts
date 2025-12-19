import { NextRequest, NextResponse } from 'next/server';
import type { SubscriptionTier } from '@prisma/client';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  getAnalyticsRetentionCutoffDate,
  getAnalyticsRetentionDays,
  getEffectiveStartDate,
} from '@/lib/analytics-retention';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const profileId = searchParams.get('profile');
  const rawRange = searchParams.get('range');
  const parsedRange = rawRange ? parseInt(rawRange, 10) : NaN;
  const requestedDays = Number.isFinite(parsedRange) ? parsedRange : NaN;

  if (!profileId) {
    return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
  }

  const [profile, user] = await Promise.all([
    prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id, deletedAt: null },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    }),
  ]);

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const subscriptionTier = (user?.subscriptionTier ?? 'FREE') as SubscriptionTier;
  const retentionDays = getAnalyticsRetentionDays(subscriptionTier);
  const retentionCutoffDate = getAnalyticsRetentionCutoffDate(subscriptionTier);

  const normalizedRequestedDays = requestedDays > 0 ? requestedDays : retentionDays;
  const effectiveDays = Math.min(normalizedRequestedDays, retentionDays);

  const requestedStartDate = new Date(Date.now() - normalizedRequestedDays * 24 * 60 * 60 * 1000);
  const startDate = getEffectiveStartDate({ requestedStartDate, retentionCutoffDate });

  const analytics = await prisma.analytics.findMany({
    where: {
      link: { profileId },
      clickedAt: { gte: startDate },
    },
    include: {
      link: {
        select: {
          title: true,
          url: true,
        },
      },
    },
    orderBy: { clickedAt: 'desc' },
  });

  const csvRows = [
    ['Date', 'Time', 'Link Title', 'Link URL', 'Country', 'Device Type', 'Referrer'].join(','),
  ];

  analytics.forEach((entry) => {
    const date = entry.clickedAt.toLocaleDateString();
    const time = entry.clickedAt.toLocaleTimeString();
    const title = `"${entry.link.title.replace(/"/g, '""')}"`;
    const url = `"${entry.link.url.replace(/"/g, '""')}"`;
    const country = entry.country || 'Unknown';
    const device = entry.deviceType;
    const referrer = entry.referrer ? `"${entry.referrer.replace(/"/g, '""')}"` : 'Direct';

    csvRows.push([date, time, title, url, country, device, referrer].join(','));
  });

  const csv = csvRows.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-${profile.slug}-${new Date().toISOString().split('T')[0]}-last-${effectiveDays}-days.csv"`,
    },
  });
}
