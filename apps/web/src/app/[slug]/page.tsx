import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProfilePreview } from '@/components/profile-preview';
import { prisma } from '@/lib/prisma';
import { normalizeThemeSettings } from '@/lib/theme-settings';
import { createDefaultBlockContent } from '@/lib/block-types';
import type { BlockContent, BlockType, BlockParentType } from '@/types/blocks';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const profile = await prisma.profile.findFirst({
    where: { slug: params.slug, deletedAt: null, status: 'ACTIVE' },
    select: { slug: true, displayName: true, bio: true, image: true },
  });

  if (!profile) {
    return {
      title: 'Profile not found',
      robots: { index: false, follow: false },
    };
  }

  const title = profile.displayName
    ? `${profile.displayName} (@${profile.slug})`
    : `@${profile.slug}`;

  return {
    title,
    description: profile.bio ?? undefined,
    openGraph: {
      title,
      description: profile.bio ?? undefined,
      type: 'website',
      images: profile.image ? [{ url: profile.image }] : undefined,
    },
    alternates: {
      canonical: `/${profile.slug}`,
    },
  };
}

export default async function PublicProfilePage({ params }: { params: { slug: string } }) {
  const profile = await prisma.profile.findFirst({
    where: { slug: params.slug, deletedAt: null, status: 'ACTIVE' },
    include: {
      user: {
        select: { subscriptionTier: true },
      },
      links: {
        where: { deletedAt: null, status: { in: ['ACTIVE', 'HIDDEN'] } },
        orderBy: { position: 'asc' },
      },
      pages: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  const theme = normalizeThemeSettings(profile.themeSettings);
  const canUseCustomScripts = profile.user.subscriptionTier === 'PRO';

  const rawElements = await prisma.block.findMany({
    where: {
      parentType: 'PROFILE',
      parentId: profile.id,
    },
    orderBy: { order: 'asc' },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          icon: true,
          isPublished: true,
          blocks: {
            where: { parentType: 'PAGE' },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  const mapBlock = (b: (typeof rawElements)[number]) => {
    const content =
      b.content && typeof b.content === 'object'
        ? (b.content as unknown as BlockContent)
        : createDefaultBlockContent(b.type as unknown as BlockType);

    return {
      id: b.id,
      type: b.type as unknown as BlockType,
      order: b.order,
      parentId: b.parentId,
      parentType: b.parentType as unknown as BlockParentType,
      profileId: b.profileId,
      pageId: b.pageId,
      iconName: b.iconName,
      fontColor: b.fontColor,
      bgColor: b.bgColor,
      content,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      page: b.page
        ? {
            id: b.page.id,
            title: b.page.title,
            slug: b.page.slug,
            icon: b.page.icon,
            isPublished: b.page.isPublished,
            blocks: b.page.blocks.map((child) => ({
              id: child.id,
              type: child.type as unknown as BlockType,
              order: child.order,
              parentId: child.parentId,
              parentType: child.parentType as unknown as BlockParentType,
              profileId: child.profileId,
              pageId: child.pageId,
              iconName: child.iconName,
              fontColor: child.fontColor,
              bgColor: child.bgColor,
              content:
                child.content && typeof child.content === 'object'
                  ? (child.content as unknown as BlockContent)
                  : createDefaultBlockContent(child.type as unknown as BlockType),
              createdAt: child.createdAt.toISOString(),
              updatedAt: child.updatedAt.toISOString(),
            })),
          }
        : null,
    };
  };

  const elements = rawElements.map(mapBlock);

  return (
    <>
      <ProfilePreview
        profile={{
          slug: profile.slug,
          displayName: profile.displayName,
          bio: profile.bio,
          image: profile.image,
          themeSettings: theme,
        }}
        elements={elements}
        links={profile.links
          .filter((l) => l.linkType !== 'BLOCK')
          .map((l) => ({
            id: l.id,
            title: l.title,
            url: l.url,
            linkType: l.linkType as 'URL' | 'COPY_FIELD',
            status: l.status,
            deletedAt: l.deletedAt,
            metadata: l.metadata,
          }))}
        showQr
        pages={profile.pages.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          icon: p.icon,
        }))}
      />

      {/* Inject custom scripts for PRO users */}
      {canUseCustomScripts && (
        <>
          {profile.customHeadScript && (
            <div dangerouslySetInnerHTML={{ __html: profile.customHeadScript }} />
          )}
          {profile.customBodyScript && (
            <div dangerouslySetInnerHTML={{ __html: profile.customBodyScript }} />
          )}
        </>
      )}
    </>
  );
}
