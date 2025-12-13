import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProfilePreview } from '@/components/profile-preview';
import { prisma } from '@/lib/prisma';
import { normalizeThemeSettings } from '@/lib/theme-settings';

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
      links: {
        where: { deletedAt: null, status: { in: ['ACTIVE', 'HIDDEN'] } },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  return (
    <ProfilePreview
      profile={{
        slug: profile.slug,
        displayName: profile.displayName,
        bio: profile.bio,
        image: profile.image,
        themeSettings: normalizeThemeSettings(profile.themeSettings),
      }}
      links={profile.links.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        status: l.status,
        deletedAt: l.deletedAt,
        metadata: l.metadata,
      }))}
      showQr
    />
  );
}
