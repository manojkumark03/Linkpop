import { getTierBenefits, isProTier as checkIsProTier, type TierName } from "@/config/tier-benefits"

export type SubscriptionTier = TierName

export interface SubscriptionLimits {
  maxLinks: number
  maxUrls: number
  analyticsRetentionDays: number
  customDomain: boolean
  customJS: boolean
  advancedBlocks: boolean
  removeWatermark: boolean
}

export function getSubscriptionLimits(tier: SubscriptionTier | string | undefined): SubscriptionLimits {
  const benefits = getTierBenefits(tier)
  return {
    maxLinks: benefits.maxLinks,
    maxUrls: benefits.maxUrls,
    analyticsRetentionDays: benefits.analyticsRetentionDays,
    customDomain: benefits.customDomain,
    customJS: benefits.customJS,
    advancedBlocks: benefits.advancedBlocks,
    removeWatermark: benefits.removeWatermark,
  }
}

export function isProTier(tier: string | undefined): boolean {
  return checkIsProTier(tier)
}

// Whop configuration
export const WHOP_CONFIG = {
  checkoutUrl: process.env.WHOP_CHECKOUT_URL || "https://whop.com/checkout/your-product-id",
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET || "",
  proPlanId: process.env.WHOP_PRO_PLAN_ID || "plan_pro",
}
