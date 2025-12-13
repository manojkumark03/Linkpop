import * as React from 'react';
import { Card, CardContent, Skeleton } from '@acme/ui';

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
