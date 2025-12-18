import Link from 'next/link';
import type { SubscriptionTier } from '@prisma/client';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { BarChart3, Zap } from 'lucide-react';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { AnimatedPage } from '@/components/animated-page';
import { requireAuth } from '@/lib/auth-helpers';
import {
  getAnalyticsRetentionCutoffDate,
  getAnalyticsRetentionDays,
  getEffectiveStartDate,
} from '@/lib/analytics-retention';
import { prisma } from '@/lib/prisma';

import { AnalyticsCharts } from './_components/analytics-charts';
import { TopLinks } from './_components/top-links';
import { TopPages } from './_components/top-pages';
import { GeographicBreakdown } from './_components/geographic-breakdown';
import { DeviceBreakdown } from './_components/device-breakdown';
import { ReferrerSources } from './_components/referrer-sources';
import { DateRangeSelector } from './_components/date-range-selector';
import { AnalyticsProfileSwitcher } from './_components/profile-switcher';

interface AnalyticsPageProps {
  searchParams: { range?: string; profile?: string };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const user = await requireAuth();

  const subscriptionTier = (user.subscriptionTier as SubscriptionTier | undefined) ?? 'FREE';
  const retentionDays = getAnalyticsRetentionDays(subscriptionTier);
  const retentionCutoffDate = getAnalyticsRetentionCutoffDate(subscriptionTier);

  const range = searchParams.range || '7';
  const daysAgo = parseInt(range);

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      slug: true,
      displayName: true,
    },
  });

  const selectedProfileId =
    searchParams.profile && profiles.some((p) => p.id === searchParams.profile)
      ? searchParams.profile
      : profiles[0]?.id;

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  if (!selectedProfileId || !profiles.length) {
    return (
      <div className="space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Analytics', href: '/dashboard/analytics' },
          ]}
        />
        <div className="text-center">
          <h1 className="text-3xl font-bold">No profiles found</h1>
          <p className="text-muted-foreground mt-2">Create a profile to view analytics</p>
        </div>
      </div>
    );
  }

  const requestedStartDate =
    daysAgo === 0 ? new Date(0) : new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  const startDate = getEffectiveStartDate({
    requestedStartDate,
    retentionCutoffDate,
  });

  const isRetentionLimitingRange = requestedStartDate < retentionCutoffDate;

  const totalClicksDescription = (() => {
    if (daysAgo === 0) return `Last ${retentionDays} days`;
    if (isRetentionLimitingRange) {
      return `Last ${daysAgo} days (limited to ${retentionDays} days)`;
    }
    return `Last ${daysAgo} days`;
  })();

  const [totalClicks, analytics, topLinks, topPages, countries, devices, referrers] = await Promise.all([
    prisma.analytics.count({
      where: {
        link: { profileId: selectedProfileId },
        clickedAt: { gte: startDate },
      },
    }),
    prisma.analytics.findMany({
      where: {
        link: { profileId: selectedProfileId },
        clickedAt: { gte: startDate },
      },
      orderBy: { clickedAt: 'asc' },
      select: {
        clickedAt: true,
      },
    }),
    prisma.analytics.groupBy({
      by: ['linkId'],
      where: {
        link: { profileId: selectedProfileId },
        clickedAt: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.pageAnalytics.groupBy({
      by: ['pageId'],
      where: {
        page: { profileId: selectedProfileId },
        viewedAt: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.analytics.groupBy({
      by: ['country'],
      where: {
        link: { profileId: selectedProfileId },
        clickedAt: { gte: startDate },
        country: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.analytics.groupBy({
      by: ['deviceType'],
      where: {
        link: { profileId: selectedProfileId },
        clickedAt: { gte: startDate },
      },
      _count: { id: true },
    }),
    prisma.analytics.groupBy({
      by: ['referrer'],
      where: {
        link: { profileId: selectedProfileId },
        clickedAt: { gte: startDate },
        referrer: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  const linkIds = topLinks.map((l) => l.linkId);
  const links = await prisma.link.findMany({
    where: { id: { in: linkIds } },
    select: { id: true, title: true, url: true },
  });

  const topLinksData = topLinks.map((tl) => {
    const link = links.find((l) => l.id === tl.linkId);
    return {
      id: tl.linkId,
      title: link?.title || 'Unknown',
      url: link?.url || '#',
      clicks: tl._count.id,
    };
  });

  const pageIds = topPages.map((p) => p.pageId);
  const pages = await prisma.page.findMany({
    where: { id: { in: pageIds } },
    select: { id: true, title: true, slug: true, icon: true },
  });

  const topPagesData = topPages.map((tp) => {
    const page = pages.find((p) => p.id === tp.pageId);
    return {
      id: tp.pageId,
      title: page?.title || 'Unknown',
      slug: page?.slug || '#',
      icon: page?.icon,
      views: tp._count.id,
    };
  });

  return (
    <AnimatedPage>
      <div className="space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: `/dashboard?profile=${selectedProfileId}` },
            {
              label: selectedProfile?.displayName || selectedProfile?.slug || 'Profile',
              href: `/dashboard?profile=${selectedProfileId}`,
            },
            {
              label: 'Analytics',
              href: `/dashboard/analytics?profile=${selectedProfileId}&range=${range}`,
            },
          ]}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">
                Analytics for {selectedProfile?.displayName || selectedProfile?.slug}
              </h1>
              <Badge variant="secondary" className="gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Last {retentionDays} Days
              </Badge>
            </div>
            <p className="text-muted-foreground">Track clicks and visitor stats for this profile</p>
            {subscriptionTier === 'PRO' ? (
              <p className="text-muted-foreground text-sm">Viewing full year of analytics.</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Viewing last 7 days. Upgrade to PRO for 1-year history.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            {profiles.length > 1 ? (
              <AnalyticsProfileSwitcher
                profiles={profiles}
                selectedProfileId={selectedProfileId}
                range={range}
              />
            ) : null}

            <div className="flex flex-wrap gap-2">
              <DateRangeSelector currentRange={range} profileId={selectedProfileId} />
              <Button variant="outline" asChild>
                <a href={`/dashboard/analytics/export?profile=${selectedProfileId}&range=${range}`}>
                  Export CSV
                </a>
              </Button>
            </div>
          </div>
        </div>

        {subscriptionTier === 'FREE' ? (
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <Zap className="text-primary mt-1 h-7 w-7" />
                  <div>
                    <h3 className="font-semibold">Don't lose your funnel data</h3>
                    <p className="text-muted-foreground text-sm">
                      Unlock 1-year analytics retention, custom JavaScript injection, and a built-in
                      URL shortener.
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/pricing">Upgrade - $9/mo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Total Clicks</CardTitle>
            <CardDescription>{totalClicksDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        {totalClicks === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No analytics yet</CardTitle>
              <CardDescription>Share your profile to start tracking clicks.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href={`/${selectedProfile?.slug}`} target="_blank" rel="noreferrer">
                  Open profile
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <AnalyticsCharts analytics={analytics} range={daysAgo} retentionDays={retentionDays} />

        <div className="grid gap-6 md:grid-cols-2">
          <TopLinks links={topLinksData} />
          <TopPages pages={topPagesData} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <GeographicBreakdown countries={countries} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <DeviceBreakdown devices={devices} />
          <ReferrerSources referrers={referrers} />
        </div>
      </div>
    </AnimatedPage>
  );
}
