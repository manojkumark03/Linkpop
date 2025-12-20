import { prisma } from './prisma';
import { getFeatureFlags } from './feature-flags';

export async function getUserSubscription(userId: string) {
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionStatus: true },
    }),
    prisma.subscription.findFirst({
      where: { userId },
      select: {
        id: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    }),
  ]);

  const subscriptionTier = user?.subscriptionTier ?? 'FREE';

  return {
    subscriptionTier,
    subscriptionStatus: user?.subscriptionStatus ?? 'ACTIVE',
    isPro: subscriptionTier === 'PRO',
    providerStatus: subscription?.status ?? null,
    currentPeriodStart: subscription?.currentPeriodStart ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    features: getFeatureFlags(),
  };
}

export async function canUserCreateLink(_userId: string): Promise<boolean> {
  // Linkforest: unlimited links for all users.
  return true;
}

export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionStatus: true },
  });

  return user?.subscriptionTier === 'PRO' && user.subscriptionStatus === 'ACTIVE';
}

export async function getUserLinkCount(userId: string): Promise<number> {
  return prisma.link.count({ where: { profile: { userId } } });
}
