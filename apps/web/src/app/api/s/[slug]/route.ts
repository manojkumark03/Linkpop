import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectDeviceType } from '@/lib/device-detect';

function getCountryFromRequest(request: NextRequest): string | null {
  // Simple implementation - you can enhance this later
  const country =
    request.headers.get('x-country') || request.headers.get('cf-ipcountry') || request.geo?.country;
  return country || null;
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    // Find the short link - need to check all active links by slug
    const shortLink = await prisma.shortLink.findFirst({
      where: { slug, isActive: true },
      include: {
        user: {
          select: { subscriptionTier: true },
        },
        profile: {
          select: { slug: true, status: true },
        },
      },
    });

    if (!shortLink) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Check if link is active
    if (!shortLink.isActive) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Get analytics data
    const country = await getCountryFromRequest(request);
    const deviceType = detectDeviceType(request.headers.get('user-agent') || '');
    const referrer = request.headers.get('referer') || '';

    // Record the click
    await prisma.shortLinkClick.create({
      data: {
        shortLinkId: shortLink.id,
        country: country || null,
        deviceType,
        referrer,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Redirect to target URL
    return NextResponse.redirect(shortLink.targetUrl, {
      status: 302,
    });
  } catch (error) {
    console.error('Error handling short link redirect:', error);
    return NextResponse.redirect(new URL('/404', request.url));
  }
}
