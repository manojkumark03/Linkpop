import { NextRequest, NextResponse } from 'next/server';

import type { Page as PrismaPage } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { updatePageSchema } from '@/lib/validations/pages';
import type { Page, PageDeleteResponse, PageUpdateResponse } from '@/types/pages';

function serializePage(page: PrismaPage): Page {
  return {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { profileId: string; pageId: string } },
) {
  try {
    const user = await requireAuth();
    const { profileId, pageId } = params;

    // Read request body only once to avoid "Body has already been read" error
    const body = await request.json();

    const result = updatePageSchema.safeParse(body);
    if (!result.success) {
      console.error('Page update validation failed:', {
        profileId,
        pageId,
        body,
        errors: result.error.flatten(),
      });

      // Format validation errors in a more user-friendly way
      const fieldErrors: Record<string, string> = {};
      const formErrors = result.error.flatten().fieldErrors;

      for (const [field, errors] of Object.entries(formErrors)) {
        if (errors && errors.length > 0) {
          fieldErrors[field] = errors[0]; // Take first error message
        }
      }

      return NextResponse.json<PageUpdateResponse>(
        {
          ok: false,
          error: 'Invalid page data',
          details: {
            fieldErrors,
            formErrors: result.error.flatten().formErrors,
          },
        },
        { status: 400 },
      );
    }

    const { title, slug, content, icon, isPublished, order } = result.data;

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
      return NextResponse.json<PageUpdateResponse>(
        { ok: false, error: 'Page not found' },
        { status: 404 },
      );
    }

    // Check slug uniqueness if being updated
    if (slug) {
      const existing = await prisma.page.findUnique({
        where: {
          profileId_slug: { profileId, slug },
        },
      });

      if (existing && existing.id !== pageId) {
        return NextResponse.json<PageUpdateResponse>(
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
        ...(icon !== undefined && { icon: icon ?? null }),
        ...(isPublished !== undefined && { isPublished }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json<PageUpdateResponse>({ ok: true, page: serializePage(updatedPage) });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json<PageUpdateResponse>(
      { ok: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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
      return NextResponse.json<PageDeleteResponse>(
        { ok: false, error: 'Page not found' },
        { status: 404 },
      );
    }

    await prisma.page.delete({
      where: { id: pageId },
    });

    return NextResponse.json<PageDeleteResponse>({ ok: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json<PageDeleteResponse>(
      { ok: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
