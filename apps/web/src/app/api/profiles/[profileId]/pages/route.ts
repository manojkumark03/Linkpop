import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { createPageSchema } from '@/lib/validations/pages';
import type { CreatePageInput, PageCreateResponse } from '@/types/pages';

export async function POST(request: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const user = await requireAuth();
    const { profileId } = params;

    // Read request body only once to avoid "Body has already been read" error
    const body = await request.json();
    
    const result = createPageSchema.safeParse(body);
    if (!result.success) {
      console.error('Page creation validation failed:', {
        profileId,
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

      return NextResponse.json<PageCreateResponse>(
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
        icon: icon ?? null,
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
