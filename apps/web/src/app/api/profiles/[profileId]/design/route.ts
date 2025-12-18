import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { themeSettingsSchema } from '@/lib/validations/profiles';

const updateProfileDesignSchema = z.object({
  themeSettings: themeSettingsSchema.optional(),
  image: z.string().url().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { profileId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await prisma.profile.findFirst({
    where: {
      id: params.profileId,
      userId: session.user.id,
      deletedAt: null,
    },
    select: { id: true, slug: true, themeSettings: true },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Read request body only once to avoid "Body has already been read" error
  const requestBody = await request.json().catch(() => null);
  const body = updateProfileDesignSchema.safeParse(requestBody);
  if (!body.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: body.error.flatten() },
      { status: 400 },
    );
  }

  const mergedThemeSettings = body.data.themeSettings
    ? {
        ...(typeof profile.themeSettings === 'object' && profile.themeSettings
          ? profile.themeSettings
          : {}),
        ...body.data.themeSettings,
      }
    : undefined;

  const updated = await prisma.profile.update({
    where: { id: params.profileId },
    data: {
      themeSettings: mergedThemeSettings,
      image: body.data.image === undefined ? undefined : body.data.image,
    },
    select: { id: true, slug: true, themeSettings: true, image: true },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/profiles/${updated.id}/design`);
  revalidatePath(`/${profile.slug}`);
  revalidatePath(`/${updated.slug}`);

  return NextResponse.json({ success: true, profile: updated });
}
