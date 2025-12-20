import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { detectDeviceType } from '@/lib/device-detect';
import { resolveCountry, shouldSkipAnalytics } from '@/lib/geoip';

export async function POST(request: Request, { params }: { params: { pageId: string } }) {
  const page = await prisma.page.findFirst({
    where: {
      id: params.pageId,
      isPublished: true,
      profile: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    },
    select: {
      id: true,
    },
  });

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  if (!shouldSkipAnalytics(request.headers)) {
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    try {
      const country = await resolveCountry(request.headers);

      await prisma.pageAnalytics.create({
        data: {
          pageId: page.id,
          country,
          referrer: referrer ? referrer.slice(0, 2048) : null,
          deviceType: detectDeviceType(userAgent),
          userAgent: userAgent ? userAgent.slice(0, 2048) : null,
        },
      });
    } catch (error) {
      console.error('Failed to record page view:', error);
    }
  }

  return NextResponse.json({ ok: true });
}
