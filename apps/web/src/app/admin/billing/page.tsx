import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function AdminBillingPage() {
  await requireAdmin();

  // Get subscription stats
  const subscriptions = await prisma.subscription.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { currentPeriodEnd: 'desc' },
    take: 50,
  });

  // Summary stats
  const subscriptionStats = await prisma.subscription.groupBy({
    by: ['plan', 'status'],
    _count: true,
  });

  // Calculate revenue metrics (simplified - no actual Stripe amounts)
  const totalActive = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const monthlyRecurring = totalActive * 99; // Assuming $99/month for PRO

  const planBreakdown = subscriptions.reduce(
    (acc, sub) => {
      const key = sub.plan;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statusBreakdown = subscriptions.reduce(
    (acc, sub) => {
      const key = sub.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">Monitor subscriptions and revenue</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin">Back to Admin</a>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyRecurring}</div>
            <p className="text-muted-foreground mt-1 text-xs">Estimated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalActive > 0
                ? (((statusBreakdown['CANCELED'] || 0) / subscriptions.length) * 100).toFixed(1)
                : '0'}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions by Plan</CardTitle>
          <CardDescription>Active subscriptions by tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {['FREE', 'PRO', 'BUSINESS'].map((plan) => (
              <div key={plan} className="rounded-lg border p-4">
                <h3 className="font-semibold">{plan}</h3>
                <p className="mt-2 text-2xl font-bold">{planBreakdown[plan] || 0}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Current status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {['ACTIVE', 'TRIALING', 'CANCELED', 'PAST_DUE', 'INCOMPLETE'].map((status) => (
              <div key={status} className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold">{status}</h3>
                <p className="mt-2 text-xl font-bold">{statusBreakdown[status] || 0}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
          <CardDescription>Last 50 subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No subscriptions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left">User</th>
                    <th className="px-2 py-2 text-left">Plan</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Period End</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/50 border-b">
                      <td className="px-2 py-2">
                        <div>
                          <p className="font-medium">{sub.user.name || 'Unnamed'}</p>
                          <p className="text-muted-foreground text-xs">{sub.user.email}</p>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                            sub.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
