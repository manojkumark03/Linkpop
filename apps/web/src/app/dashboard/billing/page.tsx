import Link from 'next/link';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

import { BillingActions } from './_components/billing-actions';
import { FeatureComparison } from './_components/feature-comparison';

export default async function BillingPage() {
  const user = await requireAuth();

  const [dbUser, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true, subscriptionStatus: true },
    }),
    prisma.subscription.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    }),
  ]);

  const subscriptionTier = dbUser?.subscriptionTier ?? 'FREE';
  const subscriptionStatus = dbUser?.subscriptionStatus ?? 'ACTIVE';
  const isPro = subscriptionTier === 'PRO';

  const planName = isPro ? 'Linkforest PRO' : 'Linkforest FREE';
  const planPrice = isPro ? '$9 / month' : '$0 / month';

  const statusLabel = isPro
    ? subscriptionStatus === 'ACTIVE'
      ? 'Active'
      : subscriptionStatus.toLowerCase()
    : 'Free';

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
            <h1 className="text-3xl font-bold">Billing & Plan</h1>
            <p className="text-muted-foreground">Manage your Linkforest plan</p>
          </div>
          <Button variant="outline" asChild>
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your current plan details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Plan</p>
                <p className="mt-1 text-2xl font-bold">{planName}</p>
                <p className="text-muted-foreground mt-1 text-sm">{planPrice}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    isPro ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  }`}
                >
                  {statusLabel}
                </p>
                {subscription?.status && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Provider status: {subscription.status}
                  </p>
                )}
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

            <BillingActions isPro={isPro} subscriptionId={subscription?.id} />
          </div>
        </CardContent>
      </Card>

      <FeatureComparison isPro={isPro} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Custom Scripts</CardTitle>
            <CardDescription>Add custom JavaScript to your profile (PRO only)</CardDescription>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <p className="text-muted-foreground text-sm">
                You have access to custom JavaScript injection.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  This is a PRO feature. Upgrade to inject tracking pixels and custom scripts.
                </p>
                <Button asChild>
                  <Link href="/pricing">Upgrade - $9/mo</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>URL Shortener</CardTitle>
            <CardDescription>Create short links inside Linkforest (PRO only)</CardDescription>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <p className="text-muted-foreground text-sm">
                You have access to the built-in URL shortener.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  This is a PRO feature. Upgrade to create branded short links.
                </p>
                <Button asChild>
                  <Link href="/pricing">Upgrade - $9/mo</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Your account usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Profiles</p>
              <p className="mt-1 text-2xl font-bold">Up to 5</p>
              <p className="text-muted-foreground mt-1 text-xs">Per account</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Links</p>
              <p className="mt-1 text-2xl font-bold">Unlimited</p>
              <p className="text-muted-foreground mt-1 text-xs">Add as many links as you want</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Analytics retention</p>
              <p className="mt-1 text-2xl font-bold">{isPro ? '365 days' : '7 days'}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Upgrade to PRO to keep a full year
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
