import type { SubscriptionTier } from '@prisma/client';

export const getAnalyticsRetentionDays = (tier: SubscriptionTier): number => {
  return tier === 'PRO' ? 365 : 7;
};

export const getAnalyticsRetentionCutoffDate = (tier: SubscriptionTier): Date => {
  const days = getAnalyticsRetentionDays(tier);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
};

export const getEffectiveStartDate = ({
  requestedStartDate,
  retentionCutoffDate,
}: {
  requestedStartDate: Date;
  retentionCutoffDate: Date;
}): Date => {
  return requestedStartDate > retentionCutoffDate ? requestedStartDate : retentionCutoffDate;
};
