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

  if (!displayTiers.length) return null;

  return (
    <section className={`py-24 sm:py-32 ${className || ''}`.trim()}>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Start on FREE, upgrade to PRO to keep a full year of analytics history.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-2">
          {displayTiers.map((tier) => {
            const isPro = tier.name.toUpperCase() === 'PRO';

            return (
              <Card
                key={tier.name}
                className={
                  isPro
                    ? 'border-primary flex flex-col shadow-lg'
                    : 'flex flex-col border-slate-200 shadow-sm dark:border-slate-800'
                }
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
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center">
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

                  {showCta ? (
                    <div className="mt-8 space-y-3">
                      <Button asChild className="w-full" variant={isPro ? 'default' : 'outline'}>
                        <Link href="/auth/register">
                          {isPro ? 'Upgrade to PRO - $9/mo' : 'Get started free'}
                        </Link>
                      </Button>
                      {isPro ? (
                        <p className="text-muted-foreground text-center text-xs">
                          Don't lose your funnel performance data. PRO keeps 1-year analytics
                          history.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="text-muted-foreground mt-4 text-center text-xs">
                    {isPro ? 'Cancel anytime.' : 'Upgrade anytime.'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
