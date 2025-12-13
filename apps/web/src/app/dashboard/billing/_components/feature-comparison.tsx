'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { Check, X } from 'lucide-react';

const features = [
  {
    name: 'Link Tracking',
    free: true,
    pro: true,
    business: true,
  },
  {
    name: 'Basic Analytics',
    free: true,
    pro: true,
    business: true,
  },
  {
    name: 'Advanced Analytics',
    free: false,
    pro: true,
    business: true,
  },
  {
    name: 'Custom Domains',
    free: false,
    pro: true,
    business: true,
  },
  {
    name: 'Scheduled Links',
    free: false,
    pro: true,
    business: true,
  },
  {
    name: 'API Access',
    free: false,
    pro: true,
    business: true,
  },
  {
    name: 'Team Members',
    free: false,
    pro: false,
    business: true,
  },
  {
    name: 'Custom Branding',
    free: false,
    pro: false,
    business: true,
  },
  {
    name: 'Dedicated Support',
    free: false,
    pro: false,
    business: true,
  },
];

interface FeatureComparisonProps {
  currentPlan: string;
}

export function FeatureComparison({ currentPlan }: FeatureComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Comparison</CardTitle>
        <CardDescription>Features available in each plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-3 text-left font-semibold">Feature</th>
                <th className="px-2 py-3 text-center font-semibold">
                  <div className={currentPlan === 'FREE' ? 'font-bold' : ''}>FREE</div>
                  <div className="text-muted-foreground mt-1 text-xs">$0/mo</div>
                </th>
                <th className="px-2 py-3 text-center font-semibold">
                  <div className={currentPlan === 'PRO' ? 'font-bold' : ''}>PRO</div>
                  <div className="text-muted-foreground mt-1 text-xs">$99/mo</div>
                </th>
                <th className="px-2 py-3 text-center font-semibold">
                  <div className={currentPlan === 'BUSINESS' ? 'font-bold' : ''}>BUSINESS</div>
                  <div className="text-muted-foreground mt-1 text-xs">$299/mo</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.name} className="hover:bg-muted/50 border-b">
                  <td className="px-2 py-3">{feature.name}</td>
                  <td className="px-2 py-3 text-center">
                    {feature.free ? (
                      <Check className="mx-auto h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-gray-400" />
                    )}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {feature.pro ? (
                      <Check className="mx-auto h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-gray-400" />
                    )}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {feature.business ? (
                      <Check className="mx-auto h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-gray-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
