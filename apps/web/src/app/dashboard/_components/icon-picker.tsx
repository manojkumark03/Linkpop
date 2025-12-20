'use client';

import type { LucideIcon } from 'lucide-react';
import { Github, Globe, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

import { Label, cn } from '@acme/ui';

const icons = [
  { value: '', label: 'None' },
  { value: 'website', label: 'Website' },
  { value: 'github', label: 'GitHub' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
];

const iconMap: Record<string, LucideIcon> = {
  website: Globe,
  globe: Globe,
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
};

export function IconPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const normalized = value ? String(value).toLowerCase() : '';
  const Icon = normalized ? (iconMap[normalized] ?? Globe) : null;

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Icon</Label>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'border-input bg-background flex h-10 w-10 items-center justify-center rounded-md border',
            !Icon && 'opacity-60',
          )}
          aria-hidden
        >
          {Icon ? <Icon className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
        </div>
        <select
          id={id}
          className="border-input bg-background h-10 w-full flex-1 rounded-md border px-3 text-sm"
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
    </div>
  );
}
