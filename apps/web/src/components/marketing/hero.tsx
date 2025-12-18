'use client';

import Link from 'next/link';

import { Button } from '@acme/ui';
import { siteConfig } from '@/lib/site-config';

interface HeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  backgroundImage?: string;
  className?: string;
}

export function Hero({
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  backgroundImage,
  className,
}: HeroProps) {
  const heroTitle = title || siteConfig.tagline;
  const heroDescription = description || siteConfig.description;
  const primaryAction = primaryCta || siteConfig.cta.primary;
  const secondaryAction = secondaryCta || siteConfig.cta.secondary;

  return (
    <section className={`relative overflow-hidden py-24 sm:py-32 lg:py-40 ${className || ''}`}>
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <div className="from-primary/20 to-secondary/20 h-full w-full bg-gradient-to-br" />
          <div className="bg-background/80 absolute inset-0" />
        </div>
      )}

      <div className="relative z-10">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            {subtitle && (
              <p className="text-primary mb-4 text-base font-semibold leading-7">{subtitle}</p>
            )}
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              {heroTitle}
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-8">
              {heroDescription}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link href={primaryAction.href}>{primaryAction.text}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={secondaryAction.href}>
                  {secondaryAction.text}
                  <span className="ml-2">→</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
