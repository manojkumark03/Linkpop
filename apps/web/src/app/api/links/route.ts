import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth';
import { createLinkSchema } from '@/lib/validations/links';
import { slugify } from '@/lib/slugs';

async function getUniqueLinkSlug(profileId: string, desired: string) {
  const base = desired || 'link';
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await prisma.link.findUnique({
      where: {
        profileId_slug: {
          profileId,
          slug: candidate,
        },
      },
      select: { id: true },
    });

    if (!existing) return candidate;
    attempt += 1;
    if (attempt > 50) return `${base}-${Date.now()}`;
  }
}

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  const url = new URL(request.url);
  const profileId = url.searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: auth.user.id, deletedAt: null },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const links = await prisma.link.findMany({
    where: {
      profileId,
      deletedAt: null,
      status: { not: 'ARCHIVED' },
    },
    orderBy: { position: 'asc' },
    select: {
      id: true,
      profileId: true,
      slug: true,
      title: true,
      url: true,
      position: true,
      metadata: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const result = createLinkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const profile = await prisma.profile.findFirst({
      where: { id: result.data.profileId, userId: auth.user.id, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const maxPosition = await prisma.link.aggregate({
      where: { profileId: result.data.profileId, deletedAt: null, status: { not: 'ARCHIVED' } },
      _max: { position: true },
    });

    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const desiredSlug = result.data.slug ?? slugify(result.data.title);
    const slug = await getUniqueLinkSlug(result.data.profileId, desiredSlug);

    const link = await prisma.link.create({
      data: {
        profileId: result.data.profileId,
        slug,
        title: result.data.title,
        url: result.data.url,
        status: result.data.status ?? 'ACTIVE',
        position: nextPosition,
        metadata: result.data.metadata ?? {},
      },
      select: {
        id: true,
        profileId: true,
        slug: true,
        title: true,
        url: true,
        position: true,
        metadata: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('Create link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
