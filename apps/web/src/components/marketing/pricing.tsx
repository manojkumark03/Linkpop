'use client';

import Link from 'next/link';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { siteConfig } from '@/lib/site-config';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
}

interface PricingProps {
  tiers?: PricingTier[];
  className?: string;
  showCta?: boolean;
}

export function Pricing({ tiers, className, showCta = true }: PricingProps) {
  const displayTiers = tiers || Object.values(siteConfig.pricing);

  return (
    <section className={`py-24 sm:py-32 ${className || ''}`}>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Choose the plan that's right for you. No hidden fees, cancel anytime.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {displayTiers.map((tier, index) => (
            <Card
              key={index}
              className={`flex flex-col ${index === 1 ? 'border-primary shadow-lg' : ''}`}
            >
              <CardHeader>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground ml-2 text-sm">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg
                        className="text-primary mr-3 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                {showCta && (
                  <div className="mt-8">
                    <Button
                      asChild
                      className="w-full"
                      variant={index === 1 ? 'default' : 'outline'}
                    >
                      <Link href="/auth/register">
                        {index === 0
                          ? 'Get started'
                          : index === 1
                            ? 'Start free trial'
                            : 'Contact sales'}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
