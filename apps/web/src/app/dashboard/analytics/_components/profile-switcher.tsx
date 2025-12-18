'use client';

import { useRouter } from 'next/navigation';

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@acme/ui';

export function AnalyticsProfileSwitcher({
  profiles,
  selectedProfileId,
  range,
}: {
  profiles: Array<{ id: string; slug: string; displayName: string | null }>;
  selectedProfileId: string;
  range: string;
}) {
  const router = useRouter();

  return (
    <div className="space-y-1">
      <Label>Profile</Label>
      <Select
        value={selectedProfileId}
        onValueChange={(id) => {
          const p = profiles.find((x) => x.id === id);
          toast({
            title: 'Switched profile',
            description: `Switched to ${p?.displayName || p?.slug}`,
          });
          window.location.href = `/dashboard/analytics?profile=${id}&range=${range}`;
        }}
      >
        <SelectTrigger className="h-10 min-w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {profiles.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.displayName || p.slug}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
