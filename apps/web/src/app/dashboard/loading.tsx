import { Card, CardContent, Skeleton } from '@acme/ui';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CardGrid } from '@/components/ui/card-grid';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }]} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
      </div>

      <CardGrid columns={3}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </CardGrid>

      <Card>
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    </div>
  );
}
