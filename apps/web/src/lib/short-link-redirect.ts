import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { detectDeviceType } from '@/lib/device-detect';
import { resolveCountry, shouldSkipAnalytics } from '@/lib/geoip';

function normalizeSlug(slug: string) {
  if (!slug.includes('%')) {
    return slug;
  }

  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function handleShortLinkRedirect(request: Request, slugParam: string) {
  try {
    const slug = normalizeSlug(slugParam);

    const shortLink = await prisma.shortLink.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        targetUrl: true,
      },
    });

    if (!shortLink) {
      return new NextResponse('Short link not found', { status: 404 });
    }

    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    if (!shouldSkipAnalytics(request.headers)) {
      try {
        const country = await resolveCountry(request.headers);

        await prisma.shortLinkClick.create({
          data: {
            shortLinkId: shortLink.id,
            country: country || null,
            deviceType: detectDeviceType(userAgent),
            referrer: referrer ? referrer.slice(0, 2048) : null,
            userAgent: userAgent ? userAgent.slice(0, 2048) : null,
          },
        });
      } catch (error) {
        console.error('Error tracking short link click:', error);
      }
    }

    return NextResponse.redirect(shortLink.targetUrl, { status: 302 });
  } catch (error) {
    console.error('Error handling short link redirect:', error);
    return new NextResponse('Short link not found', { status: 404 });
  }
}
