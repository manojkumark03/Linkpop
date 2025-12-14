'use client';

import { Button, Label } from '@acme/ui';
import { Square, Circle, Minus } from 'lucide-react';
import { cn } from '@acme/ui';

import type { ButtonVariant } from '@/lib/theme-settings';

interface ButtonStyleSelectorProps {
  variant: ButtonVariant;
  radius: number;
  shadow: boolean;
  onVariantChange: (variant: ButtonVariant) => void;
  onRadiusChange: (radius: number) => void;
  onShadowChange: (shadow: boolean) => void;
  className?: string;
}

export function ButtonStyleSelector({
  variant,
  radius,
  shadow,
  onVariantChange,
  onRadiusChange,
  onShadowChange,
  className,
}: ButtonStyleSelectorProps) {
  const variantOptions: Array<{ value: ButtonVariant; label: string; preview: string }> = [
    { value: 'solid', label: 'Solid', preview: 'bg-primary text-primary-foreground' },
    { value: 'outline', label: 'Outline', preview: 'border border-primary text-primary' },
    { value: 'ghost', label: 'Ghost', preview: 'text-primary hover:bg-primary/10' },
  ];

  const radiusOptions = [
    { value: 0, label: 'None', icon: Square },
    { value: 6, label: 'Small', icon: Square },
    { value: 12, label: 'Medium', icon: Circle },
    { value: 24, label: 'Large', icon: Circle },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Button Variant</Label>
        <div className="grid grid-cols-3 gap-2">
          {variantOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onVariantChange(option.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-xs transition-colors hover:bg-accent',
                variant === option.value && 'border-primary bg-primary/5',
              )}
            >
              <div
                className={cn(
                  'h-6 w-16 rounded border border-border flex items-center justify-center text-[10px] font-medium',
                  option.preview,
                )}
              >
                Sample
              </div>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Button Radius</Label>
        <div className="grid grid-cols-4 gap-2">
          {radiusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onRadiusChange(option.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-xs transition-colors hover:bg-accent',
                  radius === option.value && 'border-primary bg-primary/5',
                )}
              >
                <div
                  className="h-6 w-8 rounded border border-border flex items-center justify-center"
                  style={{ borderRadius: option.value }}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Shadow</Label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={shadow}
            onChange={(e) => onShadowChange(e.target.checked)}
            className="rounded border-border"
            id="button-shadow"
          />
          <Label htmlFor="button-shadow" className="text-sm">
            Add subtle shadow to buttons
          </Label>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preview</Label>
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex justify-center">
            <div
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                variant === 'solid' && 'bg-primary text-primary-foreground',
                variant === 'outline' && 'border border-primary text-primary bg-transparent',
                variant === 'ghost' && 'text-primary bg-transparent hover:bg-primary/10',
                shadow && 'shadow-sm',
              )}
              style={{ borderRadius: radius }}
            >
              Example Button
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}