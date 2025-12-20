import type { User } from '@prisma/client';

const PRO_FEATURES = ['custom_scripts', 'url_shortener', 'full_analytics_retention'] as const;

type ProFeature = (typeof PRO_FEATURES)[number];

export const isProFeature = (feature: string): feature is ProFeature => {
  return (PRO_FEATURES as readonly string[]).includes(feature);
};

export const canAccessFeature = (
  user: Pick<User, 'subscriptionTier'>,
  feature: string,
): boolean => {
  if (!isProFeature(feature)) return true;
  return user.subscriptionTier === 'PRO';
};
