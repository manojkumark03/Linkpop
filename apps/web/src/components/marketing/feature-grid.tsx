'use client';

import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

import { siteConfig } from '@/lib/site-config';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeatureGridProps {
  features?: Feature[];
  className?: string;
}

export function FeatureGrid({ features, className }: FeatureGridProps) {
  const displayFeatures = features || siteConfig.features;

  const getIcon = (iconName: string): LucideIcon => {
    const IconComponent = (Icons as any)[iconName] || Icons.Circle;
    return IconComponent;
  };

  return (
    <section className={`py-24 sm:py-32 ${className || ''}`}>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to share your links
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Powerful features to help you create the perfect link-in-bio experience for your
            audience.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {displayFeatures.map((feature, index) => {
              const IconComponent = getIcon(feature.icon);
              return (
                <div
                  key={index}
                  className="bg-card text-card-foreground relative rounded-2xl border p-8 shadow-sm"
                >
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <IconComponent className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold leading-8">{feature.title}</h3>
                  <p className="text-muted-foreground mt-2 text-base leading-7">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
