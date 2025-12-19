import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { detectDeviceType } from '@/lib/device-detect';
import { getCountryFromRequest } from '@/lib/geo';

export async function GET(request: Request, { params }: { params: { linkId: string } }) {
  const link = await prisma.link.findFirst({
    where: {
      id: params.linkId,
      deletedAt: null,
      status: 'ACTIVE',
      profile: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    },
    select: {
      id: true,
      url: true,
    },
  });

  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  const userAgent = request.headers.get('user-agent');
  const referrer = request.headers.get('referer');
  const country = getCountryFromRequest(request);

  await prisma.analytics.create({
    data: {
      linkId: link.id,
      country,
      referrer: referrer ? referrer.slice(0, 2048) : null,
      deviceType: detectDeviceType(userAgent),
      userAgent: userAgent ? userAgent.slice(0, 2048) : null,
    },
  });

  return NextResponse.redirect(link.url);
}
