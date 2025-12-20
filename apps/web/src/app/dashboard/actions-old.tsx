'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { createLinkSchema, reorderLinksSchema, updateLinkSchema } from '@/lib/validations/links';
import { createProfileSchema, updateProfileSchema } from '@/lib/validations/profiles';
import { slugify } from '@/lib/slugs';
import type { Block, BlockContent, BlockType } from '@/types/blocks';
import { BlockType } from '@/types/blocks';

export async function createProfileAction(input: unknown) {
  const user = await requireAuth();

  const result = createProfileSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const profileCount = await prisma.profile.count({ where: { userId: user.id, deletedAt: null } });
  if (profileCount >= 5) {
    return { ok: false as const, error: 'Maximum 5 profiles reached' };
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

export async function checkProfileSlugAvailabilityAction(slug: string) {
  const user = await requireAuth();

  const validated = createProfileSchema.shape.slug.safeParse(slug);
  if (!validated.success) {
    return {
      ok: true as const,
      available: false,
      message: validated.error.issues[0]?.message ?? 'Invalid username',
    };
  }

  const existing = await prisma.profile.findUnique({ where: { slug } });
  if (existing) {
    return { ok: true as const, available: false, message: 'Username is taken' };
  }

  const profileCount = await prisma.profile.count({ where: { userId: user.id, deletedAt: null } });
  if (profileCount >= 5) {
    return { ok: true as const, available: false, message: 'Maximum 5 profiles reached' };
  }

  return { ok: true as const, available: true, message: 'Username available' };
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
          linkType: result.data.linkType ?? 'URL',
          status: result.data.status ?? 'ACTIVE',
          position: (maxPosition._max.position ?? -1) + 1,
          metadata: (result.data.metadata ?? {}) as any,
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
      linkType: result.data.linkType,
      status: result.data.status,
      position: result.data.position,
      metadata: result.data.metadata as any,
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

export async function duplicateProfileAction(profileId: string, input: unknown) {
  const user = await requireAuth();

  const result = createProfileSchema.pick({ slug: true, displayName: true }).safeParse(input);

  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const profileCount = await prisma.profile.count({ where: { userId: user.id, deletedAt: null } });
  if (profileCount >= 5) {
    return { ok: false as const, error: 'Maximum 5 profiles reached' };
  }

  const slugOwner = await prisma.profile.findUnique({ where: { slug: result.data.slug } });
  if (slugOwner) {
    return { ok: false as const, error: 'Slug already in use' };
  }

  const source = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    include: {
      links: { where: { deletedAt: null }, orderBy: { position: 'asc' } },
    },
  });

  if (!source) {
    return { ok: false as const, error: 'Profile not found' };
  }

  const profile = await prisma.$transaction(async (tx) => {
    const created = await tx.profile.create({
      data: {
        userId: user.id,
        slug: result.data.slug,
        displayName: result.data.displayName ?? source.displayName,
        bio: source.bio,
        image: source.image,
        themeSettings: source.themeSettings as any,
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

function escapeCsv(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function createPageAction(profileId: string, input: unknown) {
  const user = await requireAuth();

  const { createPageSchema } = await import('@/lib/validations/pages');
  const result = createPageSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const { title, slug, content, icon, isPublished, order } = result.data;

  // Verify profile ownership
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    select: { id: true },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  // Check if slug already exists for this profile
  const existing = await prisma.page.findUnique({
    where: { profileId_slug: { profileId, slug } },
  });

  if (existing) {
    return { ok: false as const, error: 'Page with this slug already exists' };
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

  revalidatePath('/dashboard');
  return { ok: true as const, page };
}

export async function updatePageAction(pageId: string, input: unknown) {
  const user = await requireAuth();

  const { updatePageSchema } = await import('@/lib/validations/pages');
  const result = updatePageSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const { title, slug, content, icon, isPublished, order } = result.data;

  // Verify profile ownership and page existence
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      profile: { userId: user.id, deletedAt: null },
    },
    select: {
      id: true,
      profile: { select: { id: true, slug: true } },
    },
  });

  if (!page) {
    return { ok: false as const, error: 'Page not found' };
  }

  // Check slug uniqueness if being updated
  if (slug) {
    const existing = await prisma.page.findUnique({
      where: {
        profileId_slug: {
          profileId: page.profile.id,
          slug,
        },
      },
    });

    if (existing && existing.id !== pageId) {
      return { ok: false as const, error: 'Page with this slug already exists' };
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

  revalidatePath('/dashboard');
  revalidatePath(`/${page.profile.slug}`);
  return { ok: true as const, page: updatedPage };
}

export async function deletePageAction(pageId: string) {
  const user = await requireAuth();

  // Verify profile ownership and page existence
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      profile: { userId: user.id, deletedAt: null },
    },
    select: {
      id: true,
      profile: { select: { id: true, slug: true } },
    },
  });

  if (!page) {
    return { ok: false as const, error: 'Page not found' };
  }

  await prisma.page.delete({
    where: { id: pageId },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${page.profile.slug}`);
  return { ok: true as const };
}

export async function exportProfileAction(
  profileId: string,
  format: 'links-csv' | 'full-json' = 'full-json',
) {
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

  const date = new Date().toISOString().slice(0, 10);

  if (format === 'links-csv') {
    const header = ['title', 'url', 'position', 'status'];
    const rows = profile.links.map((l) => [
      escapeCsv(l.title),
      escapeCsv(l.url),
      String(l.position),
      l.status,
    ]);

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return {
      ok: true as const,
      content: csv,
      mimeType: 'text/csv; charset=utf-8',
      filename: `linkforest-${profile.slug}-${date}.csv`,
    };
  }

  const json = JSON.stringify(
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
  );

  return {
    ok: true as const,
    content: json,
    mimeType: 'application/json; charset=utf-8',
    filename: `linkforest-${profile.slug}-${date}.json`,
  };
}

export async function updateCustomScriptsAction(input: unknown) {
  const user = await requireAuth();

  const { updateCustomScriptsSchema } = await import('@/lib/validations/pro-features');
  const result = updateCustomScriptsSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const { profileId, customHeadScript, customBodyScript } = result.data;

  // Verify profile ownership and subscription
  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      user: { id: user.id, deletedAt: null },
    },
    select: {
      id: true,
      user: { select: { subscriptionTier: true } },
      slug: true,
    },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  if (profile.user.subscriptionTier !== 'PRO') {
    return { ok: false as const, error: 'PRO subscription required' };
  }

  const updatedProfile = await prisma.profile.update({
    where: { id: profileId },
    data: {
      customHeadScript: customHeadScript || null,
      customBodyScript: customBodyScript || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${profile.slug}`);
  return { ok: true as const, profile: updatedProfile };
}

export async function createShortLinkAction(input: unknown) {
  const user = await requireAuth();

  const { createShortLinkSchema } = await import('@/lib/validations/pro-features');
  const result = createShortLinkSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const { slug, targetUrl, title, profileId } = result.data;

  // Verify subscription
  if (user.subscriptionTier !== 'PRO') {
    return { ok: false as const, error: 'PRO subscription required' };
  }

  // Check if slug already exists for this user
  const existing = await prisma.shortLink.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  });

  if (existing) {
    return { ok: false as const, error: 'Short link with this slug already exists' };
  }

  // Verify profile ownership if profileId is provided
  if (profileId) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return { ok: false as const, error: 'Profile not found' };
    }
  }

  const shortLink = await prisma.shortLink.create({
    data: {
      userId: user.id,
      profileId: profileId || null,
      slug,
      targetUrl,
      title,
    },
  });

  revalidatePath('/dashboard');
  return {
    ok: true as const,
    shortLink: {
      ...shortLink,
      createdAt: shortLink.createdAt.toISOString(),
      updatedAt: shortLink.updatedAt.toISOString(),
    },
  };
}

export async function updateShortLinkAction(shortLinkId: string, input: unknown) {
  const user = await requireAuth();

  const { updateShortLinkSchema } = await import('@/lib/validations/pro-features');
  const result = updateShortLinkSchema.safeParse(input);
  if (!result.success) {
    return { ok: false as const, error: 'Validation failed', details: result.error.flatten() };
  }

  const { slug, targetUrl, title, isActive } = result.data;

  // Verify ownership and subscription
  const shortLink = await prisma.shortLink.findFirst({
    where: {
      id: shortLinkId,
      userId: user.id,
      user: { subscriptionTier: 'PRO' },
    },
    select: { id: true, slug: true },
  });

  if (!shortLink) {
    return { ok: false as const, error: 'Short link not found or PRO subscription required' };
  }

  // Check slug uniqueness if being updated
  if (slug && slug !== shortLink.slug) {
    const existing = await prisma.shortLink.findUnique({
      where: { userId_slug: { userId: user.id, slug } },
    });

    if (existing) {
      return { ok: false as const, error: 'Short link with this slug already exists' };
    }
  }

  const updatedShortLink = await prisma.shortLink.update({
    where: { id: shortLinkId },
    data: {
      ...(slug && slug !== shortLink.slug ? { slug } : {}),
      ...(targetUrl !== undefined && { targetUrl }),
      ...(title !== undefined && { title }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  revalidatePath('/dashboard');
  return {
    ok: true as const,
    shortLink: {
      ...updatedShortLink,
      createdAt: updatedShortLink.createdAt.toISOString(),
      updatedAt: updatedShortLink.updatedAt.toISOString(),
    },
  };
}

export async function deleteShortLinkAction(shortLinkId: string) {
  const user = await requireAuth();

  // Verify ownership and subscription
  const shortLink = await prisma.shortLink.findFirst({
    where: {
      id: shortLinkId,
      userId: user.id,
      user: { subscriptionTier: 'PRO' },
    },
    select: { id: true },
  });

  if (!shortLink) {
    return { ok: false as const, error: 'Short link not found or PRO subscription required' };
  }

  await prisma.shortLink.delete({
    where: { id: shortLinkId },
  });

  revalidatePath('/dashboard');
  return { ok: true as const };
}

// Block-related actions
export async function createBlockAction(input: unknown) {
  const user = await requireAuth();

  // Since we don't have a createBlock schema yet, we'll do basic validation
  const { linkId, type, order, content } = input as {
    linkId: string;
    type: BlockType;
    order: number;
    content: BlockContent;
  };

  if (!linkId || !type || content === undefined) {
    return { ok: false as const, error: 'Missing required fields' };
  }

  // Verify the link belongs to the user
  const link = await prisma.link.findFirst({
    where: {
      id: linkId,
      profile: { userId: user.id, deletedAt: null },
      deletedAt: null,
    },
    select: { id: true, profile: { select: { slug: true } } },
  });

  if (!link) {
    return { ok: false as const, error: 'Link not found' };
  }

  const block = await prisma.block.create({
    data: {
      linkId,
      type,
      order,
      content: content as any,
    },
  });

  // Update the link to be of type BLOCK
  await prisma.link.update({
    where: { id: linkId },
    data: { linkType: 'BLOCK' },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${link.profile.slug}`);

  return {
    ok: true as const,
    block: {
      ...block,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
    },
  };
}

export async function updateBlockAction(blockId: string, input: unknown) {
  const user = await requireAuth();

  // Verify the block belongs to the user
  const block = await prisma.block.findFirst({
    where: {
      id: blockId,
      link: {
        profile: { userId: user.id, deletedAt: null },
        deletedAt: null,
      },
    },
    select: {
      id: true,
      link: {
        select: { profile: { select: { slug: true } } },
      },
    },
  });

  if (!block) {
    return { ok: false as const, error: 'Block not found' };
  }

  const updates: any = {};
  if ('order' in input) updates.order = input.order;
  if ('content' in input) updates.content = input.content;

  const updatedBlock = await prisma.block.update({
    where: { id: blockId },
    data: updates,
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${block.link.profile.slug}`);

  return {
    ok: true as const,
    block: {
      ...updatedBlock,
      createdAt: updatedBlock.createdAt.toISOString(),
      updatedAt: updatedBlock.updatedAt.toISOString(),
    },
  };
}

export async function deleteBlockAction(blockId: string) {
  const user = await requireAuth();

  // Verify the block belongs to the user
  const block = await prisma.block.findFirst({
    where: {
      id: blockId,
      link: {
        profile: { userId: user.id, deletedAt: null },
        deletedAt: null,
      },
    },
    select: {
      id: true,
      link: {
        select: {
          id: true,
          profile: { select: { slug: true } },
        },
      },
    },
  });

  if (!block) {
    return { ok: false as const, error: 'Block not found' };
  }

  await prisma.block.delete({
    where: { id: blockId },
  });

  // Check if the link still has blocks - if not, revert to URL type
  const remainingBlocks = await prisma.block.count({
    where: { linkId: block.link.id },
  });

  if (remainingBlocks === 0) {
    await prisma.link.update({
      where: { id: block.link.id },
      data: { linkType: 'URL' },
    });
  }

  revalidatePath('/dashboard');
  revalidatePath(`/${block.link.profile.slug}`);

  return { ok: true as const };
}

export async function reorderBlocksAction(input: unknown) {
  const user = await requireAuth();

  const { linkId, orderedBlockIds } = input as {
    linkId: string;
    orderedBlockIds: string[];
  };

  if (!linkId || !Array.isArray(orderedBlockIds)) {
    return { ok: false as const, error: 'Missing required fields' };
  }

  // Verify the link belongs to the user
  const link = await prisma.link.findFirst({
    where: {
      id: linkId,
      profile: { userId: user.id, deletedAt: null },
      deletedAt: null,
    },
    select: { id: true, profile: { select: { slug: true } } },
  });

  if (!link) {
    return { ok: false as const, error: 'Link not found' };
  }

  // Verify all blocks belong to this link
  const blocks = await prisma.block.findMany({
    where: {
      linkId,
      id: { in: orderedBlockIds },
    },
    select: { id: true },
  });

  if (blocks.length !== orderedBlockIds.length) {
    return { ok: false as const, error: 'Invalid block list' };
  }

  await prisma.$transaction(
    orderedBlockIds.map((id, index) =>
      prisma.block.update({
        where: { id },
        data: { order: index },
      }),
    ),
  );

  revalidatePath('/dashboard');
  revalidatePath(`/${link.profile.slug}`);

  return { ok: true as const };
}

// Get blocks for a link
export async function getBlocksForLink(linkId: string) {
  const user = await requireAuth();

  // Verify the link belongs to the user
  const link = await prisma.link.findFirst({
    where: {
      id: linkId,
      profile: { userId: user.id, deletedAt: null },
      deletedAt: null,
    },
    select: { id: true, profile: { select: { slug: true } } },
  });

  if (!link) {
    return { ok: false as const, error: 'Link not found' };
  }

  const blocks = await prisma.block.findMany({
    where: { linkId },
    orderBy: { order: 'asc' },
  });

  return {
    ok: true as const,
    blocks: blocks.map((block) => ({
      ...block,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
    })),
  };
}

// Page Actions
export async function createPageAction(input: {
  profileId: string;
  title: string;
  slug: string;
  icon?: string | null;
  isPublished?: boolean;
}) {
  const user = await requireAuth();

  // Verify profile belongs to user
  const profile = await prisma.profile.findFirst({
    where: {
      id: input.profileId,
      userId: user.id,
      deletedAt: null,
    },
    select: { id: true, slug: true },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  // Check if slug is unique within profile
  const existingPage = await prisma.page.findFirst({
    where: {
      profileId: input.profileId,
      slug: input.slug,
    },
  });

  if (existingPage) {
    return { ok: false as const, error: 'Slug already exists in this profile' };
  }

  const page = await prisma.page.create({
    data: {
      profileId: input.profileId,
      title: input.title,
      slug: input.slug,
      icon: input.icon,
      isPublished: input.isPublished ?? true,
      content: '', // Empty content initially, will be populated by blocks
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${profile.slug}`);

  return { ok: true as const, page };
}

export async function updatePageAction(
  pageId: string,
  input: {
    title?: string;
    slug?: string;
    icon?: string | null;
    isPublished?: boolean;
  },
) {
  const user = await requireAuth();

  // Verify page belongs to user
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      profile: { userId: user.id, deletedAt: null },
    },
    select: {
      id: true,
      slug: true,
      profile: { select: { id: true, slug: true } },
    },
  });

  if (!page) {
    return { ok: false as const, error: 'Page not found' };
  }

  // Check if slug is unique within profile (if changing)
  if (input.slug && input.slug !== page.slug) {
    const existingPage = await prisma.page.findFirst({
      where: {
        profileId: page.profile.id,
        slug: input.slug,
        id: { not: pageId },
      },
    });

    if (existingPage) {
      return { ok: false as const, error: 'Slug already exists in this profile' };
    }
  }

  const updatedPage = await prisma.page.update({
    where: { id: pageId },
    data: input,
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${page.profile.slug}`);

  return { ok: true as const, page: updatedPage };
}

export async function deletePageAction(pageId: string) {
  const user = await requireAuth();

  // Verify page belongs to user
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      profile: { userId: user.id, deletedAt: null },
    },
    select: {
      id: true,
      profile: { select: { slug: true } },
    },
  });

  if (!page) {
    return { ok: false as const, error: 'Page not found' };
  }

  // Delete page and associated blocks
  await prisma.page.delete({
    where: { id: pageId },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${page.profile.slug}`);

  return { ok: true as const };
}

// Short Link Actions
export async function createShortLinkAction(input: {
  slug: string;
  targetUrl: string;
  title?: string | null;
}) {
  const user = await requireAuth();

  if (user.subscriptionTier !== 'PRO') {
    return { ok: false as const, error: 'Short links are a PRO feature' };
  }

  // Check if slug is unique for user
  const existingShortLink = await prisma.shortLink.findFirst({
    where: {
      userId: user.id,
      slug: input.slug,
    },
  });

  if (existingShortLink) {
    return { ok: false as const, error: 'Slug already exists' };
  }

  const shortLink = await prisma.shortLink.create({
    data: {
      userId: user.id,
      slug: input.slug,
      targetUrl: input.targetUrl,
      title: input.title,
      isActive: true,
    },
  });

  revalidatePath('/dashboard');

  return { ok: true as const, shortLink };
}

export async function updateShortLinkAction(
  shortLinkId: string,
  input: {
    slug?: string;
    targetUrl?: string;
    title?: string | null;
    isActive?: boolean;
  },
) {
  const user = await requireAuth();

  // Verify short link belongs to user
  const shortLink = await prisma.shortLink.findFirst({
    where: {
      id: shortLinkId,
      userId: user.id,
    },
    select: { id: true, slug: true },
  });

  if (!shortLink) {
    return { ok: false as const, error: 'Short link not found' };
  }

  // Check if slug is unique for user (if changing)
  if (input.slug && input.slug !== shortLink.slug) {
    const existingShortLink = await prisma.shortLink.findFirst({
      where: {
        userId: user.id,
        slug: input.slug,
        id: { not: shortLinkId },
      },
    });

    if (existingShortLink) {
      return { ok: false as const, error: 'Slug already exists' };
    }
  }

  const updatedShortLink = await prisma.shortLink.update({
    where: { id: shortLinkId },
    data: input,
  });

  revalidatePath('/dashboard');

  return { ok: true as const, shortLink: updatedShortLink };
}

export async function deleteShortLinkAction(shortLinkId: string) {
  const user = await requireAuth();

  // Verify short link belongs to user
  const shortLink = await prisma.shortLink.findFirst({
    where: {
      id: shortLinkId,
      userId: user.id,
    },
  });

  if (!shortLink) {
    return { ok: false as const, error: 'Short link not found' };
  }

  await prisma.shortLink.delete({
    where: { id: shortLinkId },
  });

  revalidatePath('/dashboard');

  return { ok: true as const };
}

// Page Block Actions
export async function createBlockAction(input: {
  pageId: string;
  type: BlockType;
  order: number;
  content: BlockContent;
}) {
  const user = await requireAuth();

  // Verify page belongs to user
  const page = await prisma.page.findFirst({
    where: {
      id: input.pageId,
      profile: { userId: user.id, deletedAt: null },
    },
    select: { id: true, profile: { select: { slug: true } } },
  });

  if (!page) {
    return { ok: false as const, error: 'Page not found' };
  }

  const block = await prisma.block.create({
    data: {
      pageId: input.pageId,
      type: input.type,
      order: input.order,
      content: input.content,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${page.profile.slug}`);

  return { ok: true as const, block };
}

export async function updateBlockAction(
  blockId: string,
  input: {
    order?: number;
    content?: BlockContent;
  },
) {
  const user = await requireAuth();

  // Verify block belongs to user
  const block = await prisma.block.findFirst({
    where: {
      id: blockId,
      page: {
        profile: { userId: user.id, deletedAt: null },
      },
    },
    select: {
      id: true,
      page: {
        select: { slug: true },
      },
    },
  });

  if (!block) {
    return { ok: false as const, error: 'Block not found' };
  }

  const updatedBlock = await prisma.block.update({
    where: { id: blockId },
    data: input,
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${block.page.slug}`);

  return { ok: true as const, block: updatedBlock };
}

export async function deleteBlockAction(blockId: string) {
  const user = await requireAuth();

  // Verify block belongs to user
  const block = await prisma.block.findFirst({
    where: {
      id: blockId,
      page: {
        profile: { userId: user.id, deletedAt: null },
      },
    },
    select: {
      id: true,
      page: {
        select: { slug: true },
      },
    },
  });

  if (!block) {
    return { ok: false as const, error: 'Block not found' };
  }

  await prisma.block.delete({
    where: { id: blockId },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${block.page.slug}`);

  return { ok: true as const };
}

export async function getBlocksForPage(pageId: string) {
  const user = await requireAuth();

  // Verify page belongs to user
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      profile: { userId: user.id, deletedAt: null },
    },
    select: { id: true, profile: { select: { slug: true } } },
  });

  if (!page) {
    return { ok: false as const, error: 'Page not found' };
  }

  const blocks = await prisma.block.findMany({
    where: { pageId },
    orderBy: { order: 'asc' },
  });

  return {
    ok: true as const,
    blocks: blocks.map((block) => ({
      ...block,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
    })),
  };
}
