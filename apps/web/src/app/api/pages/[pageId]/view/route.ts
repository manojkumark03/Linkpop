import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { detectDeviceType } from '@/lib/device-detect';

function getCountryFromHeaders(headers: Headers) {
  return (
    headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || headers.get('x-country')
  );
}

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

  const userAgent = request.headers.get('user-agent');
  const referrer = request.headers.get('referer');
  const country = getCountryFromHeaders(request.headers);

  try {
    await prisma.pageAnalytics.create({
      data: {
        pageId: page.id,
        country: country ? country.slice(0, 2) : null,
        referrer: referrer ? referrer.slice(0, 2048) : null,
        deviceType: detectDeviceType(userAgent),
        userAgent: userAgent ? userAgent.slice(0, 2048) : null,
      },
    });
  } catch (error) {
    // Silently fail - don't interrupt page load if analytics fails
    console.error('Failed to record page view:', error);
  }

  return NextResponse.json({ ok: true });
}
