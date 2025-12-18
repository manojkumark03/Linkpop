import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  // Get overall stats
  const [
    totalUsers,
    activeUsers,
    totalProfiles,
    totalLinks,
    totalClicks,
    paidUsers,
    recentAnalytics,
    topCountries,
    deviceBreakdown,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.user.count({ where: { subscriptionTier: 'PRO', deletedAt: null } }),
    prisma.profile.count({ where: { deletedAt: null } }),
    prisma.link.count({ where: { deletedAt: null } }),
    prisma.analytics.count(),
    prisma.analytics.findMany({
      take: 10,
      orderBy: { clickedAt: 'desc' },
      include: {
        link: {
          include: {
            profile: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.analytics.groupBy({
      by: ['country'],
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 5,
    }),
    prisma.analytics.groupBy({
      by: ['deviceType'],
      _count: true,
    }),
  ]);

  const unpaidUsers = totalUsers - paidUsers;

  const clicks7d = await prisma.analytics.count({
    where: {
      clickedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  const clicks30d = await prisma.analytics.count({
    where: {
      clickedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Usage Overview</h1>
          <p className="text-muted-foreground">System-wide metrics and statistics</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin">Back to Admin</a>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-muted-foreground mt-1 text-xs">Active: {activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProfiles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLinks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              7d: {clicks7d} | 30d: {clicks30d}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">PRO Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidUsers}</div>
            <p className="text-muted-foreground mt-1 text-xs">FREE: {unpaidUsers}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tier Breakdown</CardTitle>
          <CardDescription>Linkforest has two tiers: FREE ($0) and PRO ($9/mo).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">PRO</h3>
              <p className="mt-2 text-2xl font-bold">{paidUsers}</p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">FREE</h3>
              <p className="mt-2 text-2xl font-bold">{unpaidUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
          <CardDescription>Clicks by device type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deviceBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet</p>
            ) : (
              deviceBreakdown.map((item) => (
                <div key={item.deviceType} className="flex items-center justify-between">
                  <span className="text-sm">{item.deviceType}</span>
                  <span className="font-semibold">{item._count}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Countries */}
      <Card>
        <CardHeader>
          <CardTitle>Top Countries</CardTitle>
          <CardDescription>Clicks by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCountries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet</p>
            ) : (
              topCountries.map((item) => (
                <div key={item.country} className="flex items-center justify-between">
                  <span className="text-sm">{item.country || 'Unknown'}</span>
                  <span className="font-semibold">{item._count}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clicks</CardTitle>
          <CardDescription>Last 10 tracked clicks</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAnalytics.length === 0 ? (
            <p className="text-muted-foreground text-sm">No clicks yet</p>
          ) : (
            <div className="space-y-3">
              {recentAnalytics.map((click) => (
                <div key={click.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {click.link.profile.user.name || click.link.profile.user.email}
                      </p>
                      <p className="text-muted-foreground">
                        {click.link.title} ({click.country}, {click.deviceType})
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      {new Date(click.clickedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
