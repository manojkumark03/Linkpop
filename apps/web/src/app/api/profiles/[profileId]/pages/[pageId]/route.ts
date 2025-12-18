import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { updatePageSchema } from '@/lib/validations/pages';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { profileId: string; pageId: string } },
) {
  try {
    const user = await requireAuth();
    const { profileId, pageId } = params;

    const result = updatePageSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { title, slug, content, isPublished, order } = result.data;

    // Verify profile ownership and page existence
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        profileId,
        profile: { userId: user.id, deletedAt: null },
      },
      select: { id: true },
    });

    if (!page) {
      return NextResponse.json({ ok: false, error: 'Page not found' }, { status: 404 });
    }

    // Check slug uniqueness if being updated
    if (slug) {
      const existing = await prisma.page.findUnique({
        where: {
          profileId_slug: { profileId, slug },
        },
      });

      if (existing && existing.id !== pageId) {
        return NextResponse.json(
          { ok: false, error: 'Page with this slug already exists' },
          { status: 400 },
        );
      }
    }

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(isPublished !== undefined && { isPublished }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ ok: true, page: updatedPage });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { profileId: string; pageId: string } },
) {
  try {
    const user = await requireAuth();
    const { profileId, pageId } = params;

    // Verify profile ownership and page existence
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        profileId,
        profile: { userId: user.id, deletedAt: null },
      },
      select: { id: true },
    });

    if (!page) {
      return NextResponse.json({ ok: false, error: 'Page not found' }, { status: 404 });
    }

    await prisma.page.delete({
      where: { id: pageId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
