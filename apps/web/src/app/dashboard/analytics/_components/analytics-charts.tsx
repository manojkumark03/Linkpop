'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsChartsProps {
  analytics: Array<{ clickedAt: Date }> | null | undefined;
  range: number;
  retentionDays: number;
}

export function AnalyticsCharts({ analytics, range, retentionDays }: AnalyticsChartsProps) {
  const days = range === 0 ? retentionDays : Math.min(range, retentionDays);
  const chartData = [];

  if (!analytics || analytics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Click Trends</CardTitle>
          <CardDescription>Daily click activity over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-80 items-center justify-center">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const clicks = analytics.filter((a) => a.clickedAt >= dayStart && a.clickedAt < dayEnd).length;

    chartData.push({
      date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Click Trends</CardTitle>
        <CardDescription>Daily click activity over the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
