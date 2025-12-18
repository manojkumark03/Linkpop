import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { createPageSchema } from '@/lib/validations/pages';

export async function POST(request: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const user = await requireAuth();
    const { profileId } = params;

    const result = createPageSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { title, slug, content, isPublished, order } = result.data;

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: user.id, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ ok: false, error: 'Profile not found' }, { status: 404 });
    }

    // Check if slug already exists for this profile
    const existing = await prisma.page.findUnique({
      where: { profileId_slug: { profileId, slug } },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Page with this slug already exists' },
        { status: 400 },
      );
    }

    // Calculate position if not provided
    let position = order;
    if (position === undefined) {
      const maxOrder = await prisma.page.aggregate({
        where: { profileId },
        _max: { order: true },
      });
      position = (maxOrder._max.order ?? -1) + 1;
    }

    const page = await prisma.page.create({
      data: {
        profileId,
        title,
        slug,
        content,
        isPublished: isPublished ?? true,
        order: position,
      },
    });

    return NextResponse.json({ ok: true, page });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const user = await requireAuth();
    const { profileId } = params;

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: user.id, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ ok: false, error: 'Profile not found' }, { status: 404 });
    }

    const pages = await prisma.page.findMany({
      where: { profileId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ ok: true, pages });
  } catch (error) {
    console.error('Error listing pages:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
