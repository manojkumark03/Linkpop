import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth';
import { updateProfileSchema } from '@/lib/validations/profiles';

export async function GET(_request: Request, { params }: { params: { profileId: string } }) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  const profile = await prisma.profile.findFirst({
    where: {
      id: params.profileId,
      userId: auth.user.id,
      deletedAt: null,
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

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request, { params }: { params: { profileId: string } }) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.profile.findFirst({
      where: {
        id: params.profileId,
        userId: auth.user.id,
        deletedAt: null,
      },
      select: { id: true, themeSettings: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (result.data.slug) {
      const slugOwner = await prisma.profile.findUnique({
        where: { slug: result.data.slug },
        select: { id: true },
      });

      if (slugOwner && slugOwner.id !== params.profileId) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
      }
    }

    const mergedThemeSettings = result.data.themeSettings
      ? {
          ...(typeof existing.themeSettings === 'object' && existing.themeSettings
            ? existing.themeSettings
            : {}),
          ...result.data.themeSettings,
        }
      : undefined;

    const profile = await prisma.profile.update({
      where: {
        id: params.profileId,
      },
      data: {
        slug: result.data.slug,
        displayName: result.data.displayName,
        bio: result.data.bio,
        image: result.data.image,
        status: result.data.status,
        themeSettings: mergedThemeSettings ? mergedThemeSettings : undefined,
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

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { profileId: string } }) {
  const auth = await requireApiUser();
  if ('response' in auth) return auth.response;

  const existing = await prisma.profile.findFirst({
    where: {
      id: params.profileId,
      userId: auth.user.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  await prisma.profile.update({
    where: { id: params.profileId },
    data: { deletedAt: new Date(), status: 'DISABLED' },
  });

  return NextResponse.json({ success: true });
}
