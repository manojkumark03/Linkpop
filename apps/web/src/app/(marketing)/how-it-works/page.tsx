import type { Metadata } from 'next';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'How it works',
  description: `Learn how ${siteConfig.name} works and how you can get started in just a few minutes.`,
};

export default function HowItWorksPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            How {siteConfig.name} works
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Getting started with {siteConfig.name} is simple. Follow these steps to create your
            perfect link-in-bio page.
          </p>
        </div>
      </div>
      <HowItWorks />
    </div>
  );
}
