'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { createLinkSchema, reorderLinksSchema, updateLinkSchema } from '@/lib/validations/links';
import { createProfileSchema, updateProfileSchema } from '@/lib/validations/profiles';
import { slugify } from '@/lib/slugs';
import { createDefaultBlockContent } from '@/lib/block-types';
import type { Block, BlockContent, BlockParentType } from '@/types/blocks';
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
  revalidatePath(`/${result.data.slug}`);

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
    where: { id: linkId, profile: { userId: user.id, deletedAt: null } },
    select: { id: true, profile: { select: { slug: true } } },
  });

  if (!existing) {
    return { ok: false as const, error: 'Link not found' };
  }

  await prisma.link.update({
    where: { id: linkId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${existing.profile.slug}`);

  return { ok: true as const };
}

export async function reorderLinksAction(input: unknown) {
  const user = await requireAuth();

  const { profileId, orderedLinkIds } = input as {
    profileId: string;
    orderedLinkIds: string[];
  };

  if (!profileId || !Array.isArray(orderedLinkIds)) {
    return { ok: false as const, error: 'Missing required fields' };
  }

  // Verify profile belongs to user
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    select: { id: true, slug: true },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  // Verify all links belong to this profile
  const links = await prisma.link.findMany({
    where: {
      profileId,
      id: { in: orderedLinkIds },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (links.length !== orderedLinkIds.length) {
    return { ok: false as const, error: 'Invalid link list' };
  }

  await prisma.$transaction(
    orderedLinkIds.map((id, index) =>
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

  const { slug, displayName } = input as { slug: string; displayName?: string };

  if (!slug || !slug.trim()) {
    return { ok: false as const, error: 'Slug is required' };
  }

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    include: {
      links: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
      },
      pages: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  const profileCount = await prisma.profile.count({ where: { userId: user.id, deletedAt: null } });
  if (profileCount >= 5) {
    return { ok: false as const, error: 'Maximum 5 profiles reached' };
  }

  const existing = await prisma.profile.findUnique({ where: { slug } });
  if (existing) {
    return { ok: false as const, error: 'Slug already in use' };
  }

  const newProfile = await prisma.$transaction(async (tx) => {
    const created = await tx.profile.create({
      data: {
        userId: user.id,
        slug,
        displayName: displayName || undefined,
        themeSettings: profile.themeSettings as any,
      },
    });

    // Copy links
    if (profile.links.length > 0) {
      await tx.link.createMany({
        data: profile.links.map((link) => ({
          profileId: created.id,
          slug: `${link.slug}-copy`,
          title: link.title,
          url: link.url,
          linkType: link.linkType,
          position: link.position,
          status: link.status,
          metadata: link.metadata as any,
        })),
      });
    }

    // Copy pages
    if (profile.pages.length > 0) {
      await tx.page.createMany({
        data: profile.pages.map((page) => ({
          profileId: created.id,
          slug: `${page.slug}-copy`,
          title: `${page.title} Copy`,
          content: page.content,
          icon: page.icon,
          isPublished: page.isPublished,
          order: page.order,
        })),
      });
    }

    return created;
  });

  revalidatePath('/dashboard');

  return { ok: true as const, profile: newProfile };
}

export async function exportProfileAction(profileId: string, format: 'links-csv' | 'full-json') {
  const user = await requireAuth();

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    include: {
      links: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
      },
      pages: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  if (format === 'links-csv') {
    const headers = ['title', 'url', 'type', 'status', 'position'];
    const rows = profile.links.map((link) => [
      link.title,
      link.url,
      link.linkType,
      link.status,
      link.position.toString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return {
      ok: true as const,
      content: csvContent,
      mimeType: 'text/csv',
      filename: `${profile.slug}-links.csv`,
    };
  }

  if (format === 'full-json') {
    const jsonContent = JSON.stringify(
      {
        profile: {
          displayName: profile.displayName,
          bio: profile.bio,
          themeSettings: profile.themeSettings,
        },
        links: profile.links,
        pages: profile.pages,
      },
      null,
      2,
    );

    return {
      ok: true as const,
      content: jsonContent,
      mimeType: 'application/json',
      filename: `${profile.slug}-full.json`,
    };
  }

  return { ok: false as const, error: 'Invalid format' };
}

export async function deleteProfileAction(profileId: string) {
  const user = await requireAuth();

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id },
    select: { id: true, slug: true },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/dashboard');

  return { ok: true as const };
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
      parentType: 'PAGE',
      parentId: input.pageId,
      pageId: input.pageId,
      type: input.type,
      order: input.order,
      content: input.content as any,
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
      parentType: 'PAGE',
      page: {
        profile: { userId: user.id, deletedAt: null },
      },
    },
    select: {
      id: true,
      page: {
        select: { slug: true, profile: { select: { slug: true } } },
      },
    },
  });

  if (!block) {
    return { ok: false as const, error: 'Block not found' };
  }

  const updatedBlock = await prisma.block.update({
    where: { id: blockId },
    data: {
      order: input.order,
      content: input.content as any,
    },
  });

  revalidatePath('/dashboard');
  if (block.page?.profile?.slug && block.page?.slug) {
    revalidatePath(`/${block.page.profile.slug}`);
    revalidatePath(`/${block.page.profile.slug}/${block.page.slug}`);
  }

  return { ok: true as const, block: updatedBlock };
}

export async function deleteBlockAction(blockId: string) {
  const user = await requireAuth();

  // Verify block belongs to user
  const block = await prisma.block.findFirst({
    where: {
      id: blockId,
      parentType: 'PAGE',
      page: {
        profile: { userId: user.id, deletedAt: null },
      },
    },
    select: {
      id: true,
      page: {
        select: { slug: true, profile: { select: { slug: true } } },
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
  if (block.page?.profile?.slug && block.page?.slug) {
    revalidatePath(`/${block.page.profile.slug}`);
    revalidatePath(`/${block.page.profile.slug}/${block.page.slug}`);
  }

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

  const mappedBlocks: Block[] = blocks.map((block) => {
    const content =
      block.content && typeof block.content === 'object'
        ? (block.content as unknown as BlockContent)
        : createDefaultBlockContent(block.type as unknown as BlockType);

    return {
      id: block.id,
      parentId: block.parentId,
      parentType: block.parentType as unknown as BlockParentType,
      profileId: block.profileId,
      pageId: block.pageId,
      iconName: block.iconName,
      fontColor: block.fontColor,
      bgColor: block.bgColor,
      type: block.type as unknown as BlockType,
      content,
      order: block.order,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
    };
  });

  return {
    ok: true as const,
    blocks: mappedBlocks,
  };
}

export async function updateCustomScriptsAction(
  profileId: string,
  input: {
    customHeadScript?: string | null;
    customBodyScript?: string | null;
  },
) {
  const user = await requireAuth();

  // Verify profile belongs to user
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    select: { id: true, slug: true },
  });

  if (!profile) {
    return { ok: false as const, error: 'Profile not found' };
  }

  const updatedProfile = await prisma.profile.update({
    where: { id: profileId },
    data: input,
  });

  revalidatePath('/dashboard');
  revalidatePath(`/${profile.slug}`);

  return { ok: true as const, profile: updatedProfile };
}
