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
import { TopShortLinks } from './_components/top-short-links';
import { GeographicBreakdown } from './_components/geographic-breakdown';
import { DeviceBreakdown } from './_components/device-breakdown';
import { ReferrerSources } from './_components/referrer-sources';
import { DateRangeSelector } from './_components/date-range-selector';
import { AnalyticsProfileSwitcher } from './_components/profile-switcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@acme/ui';

interface AnalyticsPageProps {
  searchParams: { range?: string; profile?: string; tab?: string };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const user = await requireAuth();

  const subscriptionTier = (user.subscriptionTier as SubscriptionTier | undefined) ?? 'FREE';
  const retentionDays = getAnalyticsRetentionDays(subscriptionTier);
  const retentionCutoffDate = getAnalyticsRetentionCutoffDate(subscriptionTier);

  const range = searchParams.range || '7';
  const daysAgo = parseInt(range);
  const activeTab = searchParams.tab || 'links';

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

  // Links analytics data
  const [totalClicks, analytics, topLinks, countries, devices, referrers] = await Promise.all([
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

  // Pages analytics data
  const [totalPageViews, topPages] = await Promise.all([
    prisma.pageAnalytics.count({
      where: {
        page: { profileId: selectedProfileId },
        viewedAt: { gte: startDate },
      },
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
  ]);

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

  // Short links analytics data (PRO only)
  let totalShortLinkClicks = 0;
  let shortLinkClicks: Array<{ clickedAt: Date }> = [];
  let topShortLinksData: Array<{
    id: string;
    slug: string;
    title?: string | null;
    targetUrl: string;
    clicks: number;
  }> = [];
  let shortLinkCountries: Array<{ country: string | null; _count: { id: number } }> = [];
  let shortLinkDevices: Array<{ deviceType: string; _count: { id: number } }> = [];
  let shortLinkReferrers: Array<{ referrer: string | null; _count: { id: number } }> = [];

  if (subscriptionTier === 'PRO') {
    const shortLinkWhere = {
      clickedAt: { gte: startDate },
      shortLink: {
        userId: user.id,
        OR: [{ profileId: selectedProfileId }, { profileId: null }],
      },
    };

    const [slTotal, slClicks, slTop, slCountries, slDevices, slReferrers] = await Promise.all([
      prisma.shortLinkClick.count({
        where: shortLinkWhere,
      }),
      prisma.shortLinkClick.findMany({
        where: shortLinkWhere,
        orderBy: { clickedAt: 'asc' },
        select: { clickedAt: true },
      }),
      prisma.shortLinkClick.groupBy({
        by: ['shortLinkId'],
        where: shortLinkWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.shortLinkClick.groupBy({
        by: ['country'],
        where: {
          ...shortLinkWhere,
          country: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.shortLinkClick.groupBy({
        by: ['deviceType'],
        where: shortLinkWhere,
        _count: { id: true },
      }),
      prisma.shortLinkClick.groupBy({
        by: ['referrer'],
        where: {
          ...shortLinkWhere,
          referrer: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    totalShortLinkClicks = slTotal;
    shortLinkClicks = slClicks;
    shortLinkCountries = slCountries;
    shortLinkDevices = slDevices;
    shortLinkReferrers = slReferrers;

    const shortLinkIds = slTop.map((l) => l.shortLinkId);
    const shortLinks = await prisma.shortLink.findMany({
      where: {
        id: { in: shortLinkIds },
        userId: user.id,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        targetUrl: true,
      },
    });

    topShortLinksData = slTop
      .map((tl) => {
        const shortLink = shortLinks.find((s) => s.id === tl.shortLinkId);
        if (!shortLink) return null;
        return {
          id: tl.shortLinkId,
          slug: shortLink.slug,
          title: shortLink.title,
          targetUrl: shortLink.targetUrl,
          clicks: tl._count.id,
        };
      })
      .filter(
        (
          value,
        ): value is {
          id: string;
          slug: string;
          title: string | null;
          targetUrl: string;
          clicks: number;
        } => value !== null,
      );
  }

  const hasAnyAnalytics = totalClicks > 0 || totalPageViews > 0 || totalShortLinkClicks > 0;

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
              href: `/dashboard/analytics?profile=${selectedProfileId}&range=${range}&tab=${activeTab}`,
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
                tab={activeTab}
              />
            ) : null}

            <div className="flex flex-wrap gap-2">
              <DateRangeSelector
                currentRange={range}
                profileId={selectedProfileId}
                tab={activeTab}
              />
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

        {!hasAnyAnalytics ? (
          <Card>
            <CardHeader>
              <CardTitle>No analytics yet</CardTitle>
              <CardDescription>
                Share your profile (or short links) to start tracking clicks.
              </CardDescription>
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

        {/* Tabs for Links vs Pages */}
        <Tabs defaultValue={activeTab} className="w-full">
          <div className="border-b px-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="links" className="flex items-center gap-2">
                Links Analytics
              </TabsTrigger>
              <TabsTrigger value="pages" className="flex items-center gap-2">
                Pages Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="links" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Link Clicks</CardTitle>
                <CardDescription>{totalClicksDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalClicks.toLocaleString()}</div>
              </CardContent>
            </Card>

            <AnalyticsCharts
              analytics={analytics}
              range={daysAgo}
              retentionDays={retentionDays}
              title="Link Click Trends"
              description="Daily link click activity over the selected period"
            />

            <div className="grid gap-6 md:grid-cols-2">
              <TopLinks links={topLinksData} />
              <GeographicBreakdown
                countries={countries}
                title="Link Geographic Breakdown"
                description="Link clicks by country"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DeviceBreakdown
                devices={devices}
                title="Link Device Breakdown"
                description="Link clicks by device type"
              />
              <ReferrerSources
                referrers={referrers}
                title="Link Referrer Sources"
                description="Where your link clicks are coming from"
              />
            </div>
          </TabsContent>

          <TabsContent value="pages" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Page Views</CardTitle>
                <CardDescription>{totalClicksDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalPageViews.toLocaleString()}</div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <TopPages pages={topPagesData} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Short Links Analytics (PRO only) */}
        {subscriptionTier === 'PRO' ? (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Short Link Analytics</h2>
              <p className="text-muted-foreground text-sm">
                Clicks, devices, and referrers for your short links
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Total Short Link Clicks</CardTitle>
                <CardDescription>{totalClicksDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalShortLinkClicks.toLocaleString()}</div>
              </CardContent>
            </Card>

            <AnalyticsCharts
              analytics={shortLinkClicks}
              range={daysAgo}
              retentionDays={retentionDays}
              title="Short Link Click Trends"
              description="Daily short link click activity over the selected period"
            />

            <div className="grid gap-6 md:grid-cols-2">
              <TopShortLinks links={topShortLinksData} />
              <GeographicBreakdown
                countries={shortLinkCountries}
                title="Short Link Geographic Breakdown"
                description="Short link clicks by country"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DeviceBreakdown
                devices={shortLinkDevices}
                title="Short Link Device Breakdown"
                description="Short link clicks by device type"
              />
              <ReferrerSources
                referrers={shortLinkReferrers}
                title="Short Link Referrer Sources"
                description="Where your short link clicks are coming from"
              />
            </div>
          </div>
        ) : null}
      </div>
    </AnimatedPage>
  );
}
