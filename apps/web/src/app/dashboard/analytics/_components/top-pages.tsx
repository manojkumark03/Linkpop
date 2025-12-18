import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';

interface TopPage {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  views: number;
}

interface TopPagesProps {
  pages: TopPage[];
}

export function TopPages({ pages }: TopPagesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Pages</CardTitle>
        <CardDescription>Your most viewed pages</CardDescription>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No page views recorded yet</p>
        ) : (
          <div className="space-y-4">
            {pages.map((page, index) => (
              <div key={page.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {page.icon && <span className="text-lg">{page.icon}</span>}
                      <p className="truncate font-medium">{page.title}</p>
                    </div>
                    <p className="text-muted-foreground truncate text-sm">/{page.slug}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{page.views.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">views</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
