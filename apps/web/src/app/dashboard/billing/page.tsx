import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

import { BillingActions } from './_components/billing-actions';
import { FeatureComparison } from './_components/feature-comparison';

export default async function BillingPage() {
  const user = await requireAuth();

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  const currentPlan = subscription?.plan || 'FREE';
  const currentStatus = subscription?.status || 'ACTIVE';

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Billing', href: '/dashboard/billing' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and upgrade plan</p>
          </div>
          <Button variant="outline" asChild>
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Plan</p>
                <p className="mt-1 text-2xl font-bold">{currentPlan}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    currentStatus === 'ACTIVE'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {currentStatus}
                </p>
              </div>
            </div>

            {subscription?.currentPeriodEnd && (
              <div className="border-t pt-4">
                <p className="text-muted-foreground text-sm">
                  {subscription.cancelAtPeriodEnd ? 'Cancellation scheduled for' : 'Renews on'}
                </p>
                <p className="mt-1 font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            )}

            <BillingActions currentPlan={currentPlan} subscriptionId={subscription?.id} />
          </div>
        </CardContent>
      </Card>

      <FeatureComparison currentPlan={currentPlan} />

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Your account usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Profiles</p>
              <p className="mt-1 text-2xl font-bold">-</p>
              <p className="text-muted-foreground mt-1 text-xs">Unlimited</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Links</p>
              <p className="mt-1 text-2xl font-bold">-</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {currentPlan === 'FREE' ? '10' : currentPlan === 'PRO' ? '100' : 'Unlimited'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">API Access</p>
              <p className="mt-1 text-2xl font-bold">{currentPlan === 'FREE' ? 'No' : 'Yes'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
