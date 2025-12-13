'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { X, Zap } from 'lucide-react';

interface UpgradePromptProps {
  title: string;
  description: string;
  feature: string;
  ctaText?: string;
  dismissible?: boolean;
}

export function UpgradePrompt({
  title,
  description,
  feature,
  ctaText = 'Upgrade Now',
  dismissible = true,
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <CardTitle className="text-base text-amber-900 dark:text-amber-100">
                {title}
              </CardTitle>
              <CardDescription className="text-amber-800 dark:text-amber-200">
                {description}
              </CardDescription>
            </div>
          </div>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button size="sm" className="gap-2" asChild>
          <a href="/dashboard/billing">{ctaText}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
