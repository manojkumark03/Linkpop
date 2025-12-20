'use client';

import Link from 'next/link';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { Check, Lock, Star, Zap } from 'lucide-react';

const freeFeatures = [
  'Unlimited links',
  'Copy fields',
  'Markdown pages',
  'Full customization',
  'Free subdomain (username.linkforest.com)',
  'Free custom domain',
  'QR codes',
  '7-day analytics retention',
  'Basic support',
] as const;

const proExtras = [
  { label: '1-year analytics retention', highlight: true as const },
  { label: 'Custom JavaScript injection', highlight: false as const },
  { label: 'Built-in URL shortener', highlight: false as const },
  { label: 'Priority support', highlight: false as const },
] as const;

export function FeatureComparison({ isPro }: { isPro: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>FREE</CardTitle>
          <CardDescription>$0 / month</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                PRO
                <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                  <Zap className="h-3.5 w-3.5" />
                  Best value
                </span>
              </CardTitle>
              <CardDescription>$9 / month</CardDescription>
            </div>

            {!isPro ? <Lock className="text-muted-foreground mt-1 h-5 w-5" /> : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className={isPro ? '' : 'opacity-60'}>
            <p className="mb-4 text-sm">
              <span className="font-medium">Everything in FREE</span>, plus:
            </p>
            <ul className="space-y-3 text-sm">
              {proExtras.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  {item.highlight ? (
                    <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  <span className={item.highlight ? 'font-medium' : ''}>{item.label}</span>
                </li>
              ))}
            </ul>

            <p className="text-muted-foreground mt-4 text-sm">
              Don't lose your funnel performance data. Upgrade to PRO for 1-year analytics history.
            </p>
          </div>

          {!isPro ? (
            <div className="mt-6">
              <Button asChild className="w-full">
                <Link href="/pricing">Upgrade to PRO - $9/mo</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
