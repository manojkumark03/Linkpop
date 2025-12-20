'use client';

import { Button } from '@acme/ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container space-y-8">
      <div className="border-destructive/20 bg-destructive/5 space-y-4 rounded-lg border p-6">
        <h2 className="text-destructive text-lg font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">{error.message}</p>
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
