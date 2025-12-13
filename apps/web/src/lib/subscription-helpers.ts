import { prisma } from './prisma';
import { getFeatureFlags } from './feature-flags';

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    select: {
      id: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!subscription) {
    return {
      plan: 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      features: getFeatureFlags('FREE'),
    };
  }

  return {
    ...subscription,
    features: getFeatureFlags(subscription.plan),
  };
}

export async function canUserCreateLink(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const linkCount = await prisma.link.count({
    where: { profile: { userId } },
  });

  const maxLinks = subscription.features.maxLinks;
  if (maxLinks === -1) return true; // unlimited

  return linkCount < maxLinks;
}

export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.status === 'ACTIVE';
}

export async function getUserLinkCount(userId: string): Promise<number> {
  return prisma.link.count({
    where: { profile: { userId } },
  });
}
