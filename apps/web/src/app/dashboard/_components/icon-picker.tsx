'use client';

import { Label } from '@acme/ui';

const icons = [
  { value: '', label: 'None' },
  { value: 'website', label: 'Website' },
  { value: 'github', label: 'GitHub' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
];

export function IconPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Icon</Label>
      <select
        id={id}
        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {icons.map((i) => (
          <option key={i.value} value={i.value}>
            {i.label}
          </option>
        ))}
      </select>
    </div>
  );
}
