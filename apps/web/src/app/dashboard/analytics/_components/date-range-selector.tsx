'use client';

import { Button } from '@acme/ui';
import { useRouter } from 'next/navigation';

interface DateRangeSelectorProps {
  currentRange: string;
  profileId: string;
  retentionDays: number;
}

export function DateRangeSelector({
  currentRange,
  profileId,
  retentionDays,
}: DateRangeSelectorProps) {
  const router = useRouter();

  const allRanges = [
    { label: '7 days', value: '7', days: 7 },
    { label: '30 days', value: '30', days: 30 },
    { label: '90 days', value: '90', days: 90 },
    { label: '1 year', value: '365', days: 365 },
  ];

  const ranges = allRanges.filter((r) => r.days <= retentionDays);

  return (
    <div className="flex gap-2">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={currentRange === range.value ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            router.push(`/dashboard/analytics?profile=${profileId}&range=${range.value}`)
          }
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
