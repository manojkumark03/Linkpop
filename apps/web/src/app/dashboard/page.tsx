import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { Link2, Palette, BarChart3, Eye } from 'lucide-react';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CardGrid } from '@/components/ui/card-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedPage } from '@/components/animated-page';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { slugify } from '@/lib/slugs';
import { normalizeThemeSettings } from '@/lib/theme-settings';

import { ProfileEditor } from './_components/profile-editor';
import { DashboardOnboardingTour } from './_components/onboarding-tour';
import { ShareProfileCard } from './_components/share-profile-card';

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
          action={{ label: 'Sign out', href: '/api/auth/signout?callbackUrl=/' }}
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
      pages: {
        orderBy: { order: 'asc' },
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
          action={{ label: 'Sign out', href: '/api/auth/signout?callbackUrl=/' }}
        />
      </div>
    );
  }

  const [totalClicks, clicks7d, shortLinks] = await Promise.all([
    prisma.analytics.count({
      where: { link: { profileId: profile.id } },
    }),
    prisma.analytics.count({
      where: {
        link: { profileId: profile.id },
        clickedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    user.subscriptionTier === 'PRO'
      ? prisma.shortLink.findMany({
          where: {
            userId: user.id,
            OR: [{ profileId: profile.id }, { profileId: null }],
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            slug: true,
            targetUrl: true,
            title: true,
            isActive: true,
            createdAt: true,
          },
        })
      : Promise.resolve(
          [] as Array<{
            id: string;
            slug: string;
            targetUrl: string;
            title: string | null;
            isActive: boolean;
            createdAt: Date;
          }>,
        ),
  ]);

  return (
    <AnimatedPage>
      <div className="space-y-8">
        <DashboardOnboardingTour />

        <div id="dashboard-header" className="space-y-3">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }]} />

          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Everything is included in Linkforest. Pick a profile and start building.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:gap-6" data-tour="actions">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Link2 className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Manage Links</CardTitle>
                  <CardDescription>Add, edit, reorder your links</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={`/dashboard?profile=${profile.id}#links`}>Edit Links</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Palette className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Customize Design</CardTitle>
                  <CardDescription>Change colors, fonts, and layout</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <a href={`/dashboard/profiles/${profile.id}/design`}>Open Designer</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <BarChart3 className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">View Analytics</CardTitle>
                  <CardDescription>See clicks and visitor stats</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <a href={`/dashboard/analytics?profile=${profile.id}`}>View Analytics</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Eye className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Preview Profile</CardTitle>
                  <CardDescription>See how your page looks live</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                  Open Profile
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <ShareProfileCard slug={profile.slug} />

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
            user={{
              id: user.id,
              email: user.email,
              name: user.name,
              subscriptionTier: user.subscriptionTier as 'FREE' | 'PRO',
            }}
            profiles={profiles}
            profile={{
              id: profile.id,
              slug: profile.slug,
              displayName: profile.displayName,
              bio: profile.bio,
              image: profile.image,
              status: profile.status,
              themeSettings: normalizeThemeSettings(profile.themeSettings),
              customHeadScript: profile.customHeadScript,
              customBodyScript: profile.customBodyScript,
            }}
            links={profile.links.map((l) => ({
              id: l.id,
              profileId: l.profileId,
              slug: l.slug,
              title: l.title,
              url: l.url,
              linkType: l.linkType,
              position: l.position,
              metadata: l.metadata,
              status: l.status,
            }))}
            pages={profile.pages.map((p) => ({
              id: p.id,
              profileId: p.profileId,
              title: p.title,
              slug: p.slug,
              content: p.content,
              icon: p.icon,
              isPublished: p.isPublished,
              order: p.order,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
            }))}
            shortLinks={shortLinks.map((s) => ({
              id: s.id,
              slug: s.slug,
              targetUrl: s.targetUrl,
              title: s.title,
              isActive: s.isActive,
              createdAt: s.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </AnimatedPage>
  );
}
