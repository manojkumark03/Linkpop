import type { Metadata } from 'next';
import { Pricing } from '@/components/marketing/pricing';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Simple, transparent pricing for ${siteConfig.name}. FREE ($0) and PRO ($9/mo) — upgrade for 1-year analytics retention.`,
};

export default function PricingPage() {
  return (
    <div className="py-24 sm:py-32">
      <Pricing showCta={true} />
    </div>
  );
}
