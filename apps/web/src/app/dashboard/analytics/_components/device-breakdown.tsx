'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DeviceData {
  deviceType: string;
  _count: { id: number };
}

interface DeviceBreakdownProps {
  devices: DeviceData[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8'];

export function DeviceBreakdown({ devices }: DeviceBreakdownProps) {
  const chartData = devices.map((d) => ({
    name: d.deviceType,
    value: d._count.id,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Breakdown</CardTitle>
        <CardDescription>Clicks by device type</CardDescription>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-muted-foreground text-sm">No device data available</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
