import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';

interface ReferrerData {
  referrer: string | null;
  _count: { id: number };
}

interface ReferrerSourcesProps {
  referrers: ReferrerData[];
  title?: string;
  description?: string;
}

function formatReferrer(referrer: string | null): string {
  if (!referrer) return 'Direct';

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.replace('www.', '');

    if (hostname.includes('instagram.com')) return 'Instagram';
    if (hostname.includes('twitter.com') || hostname.includes('t.co')) return 'Twitter';
    if (hostname.includes('facebook.com')) return 'Facebook';
    if (hostname.includes('linkedin.com')) return 'LinkedIn';
    if (hostname.includes('tiktok.com')) return 'TikTok';
    if (hostname.includes('youtube.com')) return 'YouTube';
    if (hostname.includes('reddit.com')) return 'Reddit';
    if (hostname.includes('pinterest.com')) return 'Pinterest';

    return hostname;
  } catch {
    return referrer.substring(0, 30);
  }
}

export function ReferrerSources({
  referrers,
  title = 'Referrer Sources',
  description = 'Where your clicks are coming from',
}: ReferrerSourcesProps) {
  const total = referrers.reduce((sum, r) => sum + r._count.id, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {referrers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No referrer data available</p>
        ) : (
          <div className="space-y-3">
            {referrers.map((referrer) => {
              const percentage = ((referrer._count.id / total) * 100).toFixed(1);
              const sourceName = formatReferrer(referrer.referrer);

              return (
                <div key={referrer.referrer || 'direct'} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{sourceName}</span>
                    <span className="text-muted-foreground">
                      {referrer._count.id} ({percentage}%)
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div className="bg-primary h-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
