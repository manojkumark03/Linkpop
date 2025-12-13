import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { detectDeviceType } from '@/lib/device-detect';

function getCountryFromHeaders(headers: Headers) {
  return (
    headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || headers.get('x-country')
  );
}

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
  const country = getCountryFromHeaders(request.headers);

  await prisma.analytics.create({
    data: {
      linkId: link.id,
      country: country ? country.slice(0, 2) : null,
      referrer: referrer ? referrer.slice(0, 2048) : null,
      deviceType: detectDeviceType(userAgent),
      userAgent: userAgent ? userAgent.slice(0, 2048) : null,
    },
  });

  return NextResponse.redirect(link.url);
}
