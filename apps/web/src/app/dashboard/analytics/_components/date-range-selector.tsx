'use client';

import { Button } from '@acme/ui';
import { useRouter } from 'next/navigation';

interface DateRangeSelectorProps {
  currentRange: string;
  profileId: string;
}

export function DateRangeSelector({ currentRange, profileId }: DateRangeSelectorProps) {
  const router = useRouter();

  const ranges = [
    { label: '7 days', value: '7' },
    { label: '30 days', value: '30' },
    { label: '90 days', value: '90' },
    { label: 'All time', value: '0' },
  ];

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
