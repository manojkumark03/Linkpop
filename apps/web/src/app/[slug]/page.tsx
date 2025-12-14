import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';

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
    include: {
      links: {
        where: { deletedAt: null, status: 'ACTIVE' },
        select: { url: true },
      },
    },
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';
  const profileUrl = `${baseUrl}/${profile.slug}`;

  // JSON-LD structured data for better SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.displayName || profile.slug,
    description: profile.bio || undefined,
    url: profileUrl,
    image: profile.image || undefined,
    sameAs: profile.links
      .map(l => l.url)
      .slice(0, 10), // Limit to first 10 links
  };

  return {
    title,
    description: profile.bio ?? undefined,
    openGraph: {
      title,
      description: profile.bio ?? undefined,
      type: 'website',
      url: profileUrl,
      images: profile.image ? [{ 
        url: profile.image,
        width: 400,
        height: 400,
        alt: profile.displayName || profile.slug
      }] : undefined,
      siteName: 'Profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: profile.bio ?? undefined,
      images: profile.image ? [profile.image] : undefined,
    },
    alternates: {
      canonical: profileUrl,
    },
    other: {
      'script:ld+json': JSON.stringify(jsonLd),
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
    <>
      {/* Analytics Pixel */}
      <AnalyticsPixel profileId={profile.id} />
      
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
        showShareBar
      />
    </>
  );
}

function AnalyticsPixel({ profileId }: { profileId: string }) {
  const pixelCode = `
    (function() {
      try {
        // Send analytics data
        fetch('/api/analytics/profile-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          keepalive: true,
          body: JSON.stringify({
            profileId: '${profileId}'
          })
        }).catch(function(error) {
          // Silently fail - don't block rendering
          console.log('Analytics tracking failed:', error);
        });
      } catch (error) {
        // Silently fail - don't block rendering
        console.log('Analytics tracking failed:', error);
      }
    })();
  `;

  return (
    <Script 
      id="analytics-pixel" 
      dangerouslySetInnerHTML={{ __html: pixelCode }}
      strategy="afterInteractive"
    />
  );
}
