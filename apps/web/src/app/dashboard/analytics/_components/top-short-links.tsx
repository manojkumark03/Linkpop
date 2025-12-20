import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';

interface TopShortLink {
  id: string;
  slug: string;
  title?: string | null;
  targetUrl: string;
  clicks: number;
}

interface TopShortLinksProps {
  links: TopShortLink[];
}

export function TopShortLinks({ links }: TopShortLinksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Short Links</CardTitle>
        <CardDescription>Your most clicked short links</CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-muted-foreground text-sm">No short link clicks recorded yet</p>
        ) : (
          <div className="space-y-4">
            {links.map((link, index) => (
              <div key={link.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{link.title || link.slug}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      linkforest.com/s/{link.slug}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">→ {link.targetUrl}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{link.clicks.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">clicks</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
