import type { SubscriptionPlan } from '@prisma/client';

export interface FeatureFlags {
  basicAnalytics: boolean;
  linkTracking: boolean;
  customDomains: boolean;
  advancedAnalytics: boolean;
  scheduledLinks: boolean;
  apiAccess: boolean;
  teamMembers: boolean;
  customBranding: boolean;
  dedicatedSupport: boolean;
  maxLinks: number;
}

const featuresByPlan: Record<SubscriptionPlan, FeatureFlags> = {
  FREE: {
    basicAnalytics: true,
    linkTracking: true,
    customDomains: false,
    advancedAnalytics: false,
    scheduledLinks: false,
    apiAccess: false,
    teamMembers: false,
    customBranding: false,
    dedicatedSupport: false,
    maxLinks: 10,
  },
  PRO: {
    basicAnalytics: true,
    linkTracking: true,
    customDomains: true,
    advancedAnalytics: true,
    scheduledLinks: true,
    apiAccess: true,
    teamMembers: false,
    customBranding: false,
    dedicatedSupport: false,
    maxLinks: 100,
  },
  BUSINESS: {
    basicAnalytics: true,
    linkTracking: true,
    customDomains: true,
    advancedAnalytics: true,
    scheduledLinks: true,
    apiAccess: true,
    teamMembers: true,
    customBranding: true,
    dedicatedSupport: true,
    maxLinks: -1, // unlimited
  },
};

export function getFeatureFlags(plan: SubscriptionPlan | null | undefined): FeatureFlags {
  if (!plan) return featuresByPlan.FREE;
  return featuresByPlan[plan];
}

export function hasFeature(
  plan: SubscriptionPlan | null | undefined,
  feature: keyof FeatureFlags,
): boolean {
  const flags = getFeatureFlags(plan);
  const value = flags[feature];

  if (typeof value === 'boolean') {
    return value;
  }

  // For numeric features like maxLinks
  return value > 0;
}

export function canCreateLinks(
  plan: SubscriptionPlan | null | undefined,
  currentCount: number,
): boolean {
  const flags = getFeatureFlags(plan);
  if (flags.maxLinks === -1) return true; // unlimited
  return currentCount < flags.maxLinks;
}
