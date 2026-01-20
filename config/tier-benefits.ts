export type TierName = "free" | "pro"

export interface TierBenefits {
  name: string
  displayName: string
  price: string
  priceDetail: string
  maxLinks: number
  maxUrls: number
  analyticsRetentionDays: number
  customDomain: boolean
  customJS: boolean
  advancedBlocks: boolean
  removeWatermark: boolean
  features: string[]
  limits: {
    links: string
    urls: string
    analytics: string
  }
}

export const TIER_CONFIG: Record<TierName, TierBenefits> = {
  free: {
    name: "free",
    displayName: "Free",
    price: "$0",
    priceDetail: "Forever free",
    maxLinks: -1, // unlimited
    maxUrls: -1, // unlimited
    analyticsRetentionDays: 365, // increased to 1 year
    customDomain: true, // enabled
    customJS: true, // enabled
    advancedBlocks: true, // enabled
    removeWatermark: true, // enabled
    features: [
      "Unlimited bio links",
      "Unlimited shortened URLs",
      "365 days analytics",
      "Advanced block types (Page, Accordion, Copy-text)",
      "Custom domain",
      "Custom JavaScript",
      "Remove Linkpop branding",
      "Advanced styling options",
      "Priority support",
    ],
    limits: {
      links: "Unlimited bio links",
      urls: "Unlimited shortened URLs",
      analytics: "1 year retention",
    },
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    price: "$9.99",
    priceDetail: "per month",
    maxLinks: -1, // unlimited
    maxUrls: -1, // unlimited
    analyticsRetentionDays: 365,
    customDomain: true,
    customJS: true,
    advancedBlocks: true,
    removeWatermark: true,
    features: [
      "Unlimited bio links",
      "Unlimited shortened URLs",
      "365 days analytics",
      "Advanced block types (Page, Accordion, Copy-text)",
      "Custom domain",
      "Custom JavaScript",
      "Priority support",
      "Remove Linkpop branding",
      "Advanced styling options",
    ],
    limits: {
      links: "Unlimited bio links",
      urls: "Unlimited shortened URLs",
      analytics: "1 year retention",
    },
  },
}

export function getTierBenefits(tier: TierName | string | undefined): TierBenefits {
  const normalizedTier = (tier?.toLowerCase() || "free") as TierName
  return TIER_CONFIG[normalizedTier] || TIER_CONFIG.free
}

export function isProTier(tier: string | undefined): boolean {
  return tier?.toLowerCase() === "pro"
}

export function canAccessFeature(
  tier: string | undefined,
  feature: keyof Omit<TierBenefits, "name" | "displayName" | "price" | "priceDetail" | "features" | "limits">,
): boolean {
  const benefits = getTierBenefits(tier)
  const value = benefits[feature]
  return typeof value === "boolean" ? value : value !== 0
}
