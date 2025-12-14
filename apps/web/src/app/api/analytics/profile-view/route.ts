import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientInfo } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Get client information
    const clientInfo = getClientInfo(request);

    // Store the profile view
    await prisma.profileView.create({
      data: {
        profileId,
        userAgent: clientInfo.userAgent,
        ipAddress: clientInfo.ipAddress,
        country: clientInfo.country,
        referrer: clientInfo.referrer,
        deviceType: clientInfo.deviceType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile view tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track profile view' },
      { status: 500 }
    );
  }
}