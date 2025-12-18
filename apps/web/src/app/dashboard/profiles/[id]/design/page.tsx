import { notFound, redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { normalizeThemeSettings } from '@/lib/theme-settings';
import { DesignEditor } from './_components/design-editor';

interface DesignPageProps {
  params: { id: string };
}

export default async function DesignPage({ params }: DesignPageProps) {
  const user = await requireAuth();
  const profileId = params.id;

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id, deletedAt: null },
    include: {
      links: {
        where: { deletedAt: null, status: { not: 'ARCHIVED' } },
        orderBy: { position: 'asc' },
        take: 5,
      },
    },
  });

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: profile.displayName || profile.slug, href: `/dashboard?profile=${profile.id}` },
          { label: 'Design', href: `/dashboard/profiles/${profile.id}/design` },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold">Profile Designer</h1>
        <p className="text-muted-foreground">Customize the look and feel of your profile</p>
      </div>

      <DesignEditor
        profile={{
          id: profile.id,
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
        }))}
      />
    </div>
  );
}
