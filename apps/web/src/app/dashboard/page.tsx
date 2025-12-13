import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CardGrid } from '@/components/ui/card-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { slugify } from '@/lib/slugs';
import { normalizeThemeSettings } from '@/lib/theme-settings';

import { ProfileEditor } from './_components/profile-editor';
import { DashboardOnboardingTour } from './_components/onboarding-tour';

async function ensureDefaultProfile(userId: string, fallback: string) {
  const existing = await prisma.profile.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true },
  });

  if (existing) return;

  const base = slugify(fallback) || `user-${userId.slice(0, 6)}`;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const slugOwner = await prisma.profile.findUnique({ where: { slug } });

    if (!slugOwner) {
      await prisma.profile.create({
        data: {
          userId,
          slug,
          displayName: fallback,
          themeSettings: {},
        },
      });
      return;
    }

    attempt += 1;
    if (attempt > 20) {
      await prisma.profile.create({
        data: {
          userId,
          slug: `${base}-${Date.now()}`,
          displayName: fallback,
          themeSettings: {},
        },
      });
      return;
    }
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { profile?: string };
}) {
  const user = await requireAuth();

  await ensureDefaultProfile(user.id, user.name || user.email || 'My Profile');

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      slug: true,
      displayName: true,
      status: true,
    },
  });

  const selectedProfileId =
    searchParams.profile && profiles.some((p) => p.id === searchParams.profile)
      ? searchParams.profile
      : profiles[0]?.id;

  if (!selectedProfileId) {
    return (
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }]} />
        <EmptyState
          title="No profile found"
          description="We couldn't find a profile for your account."
          action={{ label: 'Sign out', href: '/api/auth/signout' }}
        />
      </div>
    );
  }

  const profile = await prisma.profile.findFirst({
    where: { id: selectedProfileId, userId: user.id, deletedAt: null },
    include: {
      links: {
        where: { deletedAt: null, status: { not: 'ARCHIVED' } },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!profile) {
    return (
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }]} />
        <EmptyState
          title="Profile not found"
          description="The requested profile doesn't exist or you don't have access."
          action={{ label: 'Sign out', href: '/api/auth/signout' }}
        />
      </div>
    );
  }

  const [totalClicks, clicks7d] = await Promise.all([
    prisma.analytics.count({
      where: { link: { profileId: profile.id } },
    }),
    prisma.analytics.count({
      where: {
        link: { profileId: profile.id },
        clickedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <DashboardOnboardingTour />

      <div id="dashboard-header" className="space-y-3">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }]} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your public profile and links</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                View Public Page
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/auth/signout">Sign Out</a>
            </Button>
          </div>
        </div>
      </div>

      <div data-tour="stats">
        <CardGrid columns={3}>
          <Card>
            <CardHeader>
              <CardTitle>Total Clicks</CardTitle>
              <CardDescription>All-time tracked clicks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalClicks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Clicks (7d)</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clicks7d}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>Published + hidden</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profile.links.length}</div>
            </CardContent>
          </Card>
        </CardGrid>
      </div>

      <div data-tour="profile-editor">
        <ProfileEditor
          user={{ id: user.id, email: user.email, name: user.name }}
          profiles={profiles}
          profile={{
            id: profile.id,
            slug: profile.slug,
            displayName: profile.displayName,
            bio: profile.bio,
            image: profile.image,
            status: profile.status,
            themeSettings: normalizeThemeSettings(profile.themeSettings),
          }}
          links={profile.links.map((l) => ({
            id: l.id,
            profileId: l.profileId,
            slug: l.slug,
            title: l.title,
            url: l.url,
            position: l.position,
            metadata: l.metadata,
            status: l.status,
          }))}
        />
      </div>
    </div>
  );
}
