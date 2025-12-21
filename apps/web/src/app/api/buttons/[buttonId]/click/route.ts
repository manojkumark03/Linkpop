import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { detectDeviceType } from '@/lib/device-detect';
import { resolveCountry, shouldSkipAnalytics } from '@/lib/geoip';

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(request: Request, { params }: { params: { buttonId: string } }) {
  const button = await prisma.block.findFirst({
    where: {
      id: params.buttonId,
      type: 'BUTTON',
    },
    select: {
      id: true,
      content: true,
      parentType: true,
      parentId: true,
      profileId: true,
      pageId: true,
    },
  });

  if (!button) {
    return NextResponse.json({ error: 'Button not found' }, { status: 404 });
  }

  const url =
    button.content && typeof button.content === 'object' && typeof (button.content as any).url === 'string'
      ? ((button.content as any).url as string)
      : null;

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid button URL' }, { status: 400 });
  }

  let profileId: string | null = null;

  if (button.parentType === 'PROFILE') {
    const profile = await prisma.profile.findFirst({
      where: {
        id: button.parentId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    profileId = profile.id;
  } else {
    const page = await prisma.page.findFirst({
      where: {
        id: button.parentId,
        isPublished: true,
        profile: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      },
      select: { profileId: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    profileId = page.profileId;
  }

  if (!shouldSkipAnalytics(request.headers)) {
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    const country = await resolveCountry(request.headers);

    await prisma.buttonClick.create({
      data: {
        buttonId: button.id,
        profileId,
        country,
        referrer: referrer ? referrer.slice(0, 2048) : null,
        deviceType: detectDeviceType(userAgent),
        userAgent: userAgent ? userAgent.slice(0, 2048) : null,
      },
    });
  }

  return NextResponse.redirect(url);
}
