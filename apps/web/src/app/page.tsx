import { Hero } from '@/components/marketing/hero';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { Testimonials } from '@/components/marketing/testimonials';
import { Pricing } from '@/components/marketing/pricing';

export default function HomePage() {
  return (
    <div>
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <Testimonials />
      <Pricing />
    </div>
  );
}
