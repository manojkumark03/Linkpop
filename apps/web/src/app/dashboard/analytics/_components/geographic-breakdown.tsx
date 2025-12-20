import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';

interface GeographicData {
  country: string | null;
  _count: { id: number };
}

interface GeographicBreakdownProps {
  countries: GeographicData[];
  title?: string;
  description?: string;
}

const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BR: 'Brazil',
  MX: 'Mexico',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
};

export function GeographicBreakdown({
  countries,
  title = 'Geographic Breakdown',
  description = 'Clicks by country',
}: GeographicBreakdownProps) {
  const total = countries.reduce((sum, c) => sum + c._count.id, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {countries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No geographic data available</p>
        ) : (
          <div className="space-y-3">
            {countries.map((country) => {
              const percentage = ((country._count.id / total) * 100).toFixed(1);
              const countryName = country.country
                ? countryNames[country.country] || country.country
                : 'Unknown';

              return (
                <div key={country.country || 'unknown'} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{countryName}</span>
                    <span className="text-muted-foreground">
                      {country._count.id} ({percentage}%)
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
