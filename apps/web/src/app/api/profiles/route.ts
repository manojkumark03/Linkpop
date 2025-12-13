import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth';
import { createProfileSchema } from '@/lib/validations/profiles';

export async function GET() {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  const profiles = await prisma.profile.findMany({
    where: {
      userId: auth.user.id,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      slug: true,
      displayName: true,
      bio: true,
      image: true,
      themeSettings: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { links: true },
      },
    },
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const result = createProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.profile.findUnique({
      where: { slug: result.data.slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
    }

    const profile = await prisma.profile.create({
      data: {
        userId: auth.user.id,
        slug: result.data.slug,
        displayName: result.data.displayName,
        bio: result.data.bio,
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
        bio: true,
        image: true,
        themeSettings: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
