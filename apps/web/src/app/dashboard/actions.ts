'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { createLinkSchema, reorderLinksSchema, updateLinkSchema } from '@/lib/validations/links';
import { createProfileSchema, updateProfileSchema } from '@/lib/validations/profiles';
import { slugify } from '@/lib/slugs';

export async function createProfileAction(input: unknown) {
  const user = await requireAuth();

  const result = createProfileSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const existing = await prisma.profile.findUnique({ where: { slug: result.data.slug } });
  if (existing) {
    return { ok: false as const, error: 'Slug already in use' };
  }

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      slug: result.data.slug,
      displayName: result.data.displayName,
      bio: result.data.bio,
    },
  });

  revalidatePath('/dashboard');

  return { ok: true as const, profile };
}

export async function updateProfileAction(profileId: string, input: unknown) {
  const user = await requireAuth();

  const result = updateProfileSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const existing = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    select: { id: true, slug: true, themeSettings: true },
  });

  if (!existing) {
    return { ok: false as const, error: 'Profile not found' };
  }

  if (result.data.slug) {
    const slugOwner = await prisma.profile.findUnique({ where: { slug: result.data.slug } });
    if (slugOwner && slugOwner.id !== profileId) {
      return { ok: false as const, error: 'Slug already in use' };
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
    where: { id: profileId },
    data: {
      slug: result.data.slug,
      displayName: result.data.displayName,
      bio: result.data.bio,
      image: result.data.image,
      status: result.data.status,
      themeSettings: mergedThemeSettings ? mergedThemeSettings : undefined,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${existing.slug}`);
  revalidatePath(`/${profile.slug}`);

  return { ok: true as const, profile };
}

export async function createLinkAction(input: unknown) {
  const user = await requireAuth();

  const result = createLinkSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const profile = await prisma.profile.findFirst({
    where: { id: result.data.profileId, userId: user.id, deletedAt: null },
    select: { id: true },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  const maxPosition = await prisma.link.aggregate({
    where: { profileId: result.data.profileId, deletedAt: null, status: { not: 'ARCHIVED' } },
    _max: { position: true },
  });

  const desiredSlug = result.data.slug ?? slugify(result.data.title);
  const slugBase = desiredSlug || 'link';

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = attempt === 0 ? slugBase : `${slugBase}-${attempt + 1}`;
    const existing = await prisma.link.findUnique({
      where: { profileId_slug: { profileId: result.data.profileId, slug: candidate } },
    });
    if (!existing) {
      const link = await prisma.link.create({
        data: {
          profileId: result.data.profileId,
          slug: candidate,
          title: result.data.title,
          url: result.data.url,
          status: result.data.status ?? 'ACTIVE',
          position: (maxPosition._max.position ?? -1) + 1,
          metadata: result.data.metadata ?? {},
        },
      });

      revalidatePath('/dashboard');
      return { ok: true as const, link };
    }
    attempt += 1;
    if (attempt > 50) {
      return { ok: false as const, error: 'Unable to generate unique slug' };
    }
  }
}

export async function updateLinkAction(linkId: string, input: unknown) {
  const user = await requireAuth();

  const result = updateLinkSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const existing = await prisma.link.findFirst({
    where: { id: linkId, deletedAt: null, profile: { userId: user.id, deletedAt: null } },
    select: { id: true, profile: { select: { slug: true } } },
  });

  if (!existing) {
    return { ok: false as const, error: 'Link not found' };
  }

  const link = await prisma.link.update({
    where: { id: linkId },
    data: {
      title: result.data.title,
      url: result.data.url,
      status: result.data.status,
      position: result.data.position,
      metadata: result.data.metadata,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${existing.profile.slug}`);

  return { ok: true as const, link };
}

export async function archiveLinkAction(linkId: string) {
  const user = await requireAuth();

  const existing = await prisma.link.findFirst({
    where: { id: linkId, deletedAt: null, profile: { userId: user.id, deletedAt: null } },
    select: { id: true, profile: { select: { slug: true } } },
  });

  if (!existing) {
    return { ok: false as const, error: 'Link not found' };
  }

  await prisma.link.update({
    where: { id: linkId },
    data: { status: 'ARCHIVED', deletedAt: new Date() },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${existing.profile.slug}`);

  return { ok: true as const };
}

export async function reorderLinksAction(input: unknown) {
  const user = await requireAuth();

  const result = reorderLinksSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const profile = await prisma.profile.findFirst({
    where: { id: result.data.profileId, userId: user.id, deletedAt: null },
    select: { id: true, slug: true },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  const links = await prisma.link.findMany({
    where: {
      profileId: result.data.profileId,
      id: { in: result.data.orderedLinkIds },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (links.length !== result.data.orderedLinkIds.length) {
    return { ok: false as const, error: 'Invalid link list' };
  }

  await prisma.$transaction(
    result.data.orderedLinkIds.map((id, index) =>
      prisma.link.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  revalidatePath('/dashboard');
  revalidatePath(`/${profile.slug}`);

  return { ok: true as const };
}

export async function duplicateProfileAction(profileId: string) {
  const user = await requireAuth();

  const source = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    include: {
      links: { where: { deletedAt: null }, orderBy: { position: 'asc' } },
    },
  });

  if (!source) {
    return { ok: false as const, error: 'Profile not found' };
  }

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const slug = attempt === 0 ? `${source.slug}-copy` : `${source.slug}-copy-${attempt + 1}`;
    const existing = await prisma.profile.findUnique({ where: { slug } });

    if (!existing) {
      const profile = await prisma.$transaction(async (tx) => {
        const created = await tx.profile.create({
          data: {
            userId: user.id,
            slug,
            displayName: source.displayName ? `${source.displayName} (copy)` : null,
            bio: source.bio,
            image: source.image,
            themeSettings: source.themeSettings,
            status: source.status,
          },
        });

        if (source.links.length > 0) {
          await tx.link.createMany({
            data: source.links.map((l) => ({
              profileId: created.id,
              slug: l.slug,
              title: l.title,
              url: l.url,
              position: l.position,
              metadata: l.metadata as any,
              status: l.status,
            })),
          });
        }

        return created;
      });

      revalidatePath('/dashboard');
      return { ok: true as const, profile };
    }

    attempt += 1;
    if (attempt > 20) {
      return { ok: false as const, error: 'Unable to duplicate profile' };
    }
  }
}

export async function exportProfileAction(profileId: string) {
  const user = await requireAuth();

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    include: {
      links: { where: { deletedAt: null }, orderBy: { position: 'asc' } },
    },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  return {
    ok: true as const,
    json: JSON.stringify(
      {
        profile: {
          slug: profile.slug,
          displayName: profile.displayName,
          bio: profile.bio,
          image: profile.image,
          themeSettings: profile.themeSettings,
          status: profile.status,
        },
        links: profile.links.map((l) => ({
          slug: l.slug,
          title: l.title,
          url: l.url,
          position: l.position,
          metadata: l.metadata,
          status: l.status,
        })),
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    filename: `${profile.slug}-export.json`,
  };
}
