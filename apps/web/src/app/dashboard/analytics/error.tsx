'use client';

import { Button } from '@acme/ui';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="border-destructive/20 bg-destructive/5 space-y-4 rounded-lg border p-6">
        <h2 className="text-destructive text-lg font-semibold">Analytics Error</h2>
        <p className="text-muted-foreground text-sm">
          We had trouble loading your analytics. Please try again.
        </p>
        <p className="text-muted-foreground text-xs">{error.message}</p>
        <div className="flex gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" asChild>
            <a href="/dashboard">Go back to dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
