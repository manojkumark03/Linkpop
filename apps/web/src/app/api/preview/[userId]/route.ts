import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    // Get user's active profile
    const profile = await prisma.profile.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
        bio: true,
        image: true,
        themeSettings: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get profile elements
    const elements = await prisma.block.findMany({
      where: {
        parentId: profile.id,
        parentType: 'PROFILE',
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      profile,
      elements,
    });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json({ error: 'Failed to load preview' }, { status: 500 });
  }
}
