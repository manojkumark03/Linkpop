'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Label, X } from '@acme/ui';
import { Plus, Minus } from 'lucide-react';

import type { GradientStop } from '@/lib/theme-settings';
import { cn } from '@acme/ui';

interface GradientBuilderProps {
  stops: GradientStop[];
  angle: number;
  onStopsChange: (stops: GradientStop[]) => void;
  onAngleChange: (angle: number) => void;
  className?: string;
}

export function GradientBuilder({
  stops,
  angle,
  onStopsChange,
  onAngleChange,
  className,
}: GradientBuilderProps) {
  const [previewMode, setPreviewMode] = useState<'live' | 'final'>('live');

  const addStop = () => {
    const newStop: GradientStop = {
      color: '#6366f1',
      position: 50,
    };
    onStopsChange([...stops, newStop].sort((a, b) => a.position - b.position));
  };

  const updateStop = (index: number, field: keyof GradientStop, value: string | number) => {
    const updatedStops = stops.map((stop, i) =>
      i === index ? { ...stop, [field]: value } : stop,
    );
    onStopsChange(updatedStops.sort((a, b) => a.position - b.position));
  };

  const removeStop = (index: number) => {
    if (stops.length > 2) {
      onStopsChange(stops.filter((_, i) => i !== index));
    }
  };

  const generateCss = () => {
    const gradientStops = stops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(', ');
    return `linear-gradient(${angle}deg, ${gradientStops})`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Gradient Builder</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Preview:</span>
          <select
            className="border-input bg-background h-8 rounded border px-2 text-xs"
            value={previewMode}
            onChange={(e) => setPreviewMode(e.target.value as 'live' | 'final')}
          >
            <option value="live">Live</option>
            <option value="final">Final</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="relative h-24 rounded-lg border border-border overflow-hidden">
        <div
          className="h-full w-full transition-all duration-200"
          style={{
            background: generateCss(),
          }}
        />
        {previewMode === 'final' && (
          <div className="absolute inset-0 bg-black/20" />
        )}
      </div>

      {/* Gradient Controls */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="gradient-angle" className="text-xs">
              Angle: {angle}°
            </Label>
            <Input
              id="gradient-angle"
              type="range"
              min="0"
              max="360"
              step="15"
              value={angle}
              onChange={(e) => onAngleChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStop}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Stop
            </Button>
          </div>
        </div>

        {/* Gradient Stops */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {stops.map((stop, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded border border-border p-2"
            >
              <div
                className="h-6 w-6 rounded border border-border cursor-pointer"
                style={{ backgroundColor: stop.color }}
              >
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(index, 'color', e.target.value)}
                  className="h-full w-full cursor-pointer opacity-0"
                  aria-label={`Color for stop ${index + 1}`}
                />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Position:</span>
                  <span className="text-xs font-medium">{stop.position}%</span>
                </div>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={stop.position}
                  onChange={(e) => updateStop(index, 'position', Number(e.target.value))}
                  className="h-4"
                />
              </div>

              {stops.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStop(index)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* CSS Output */}
        <div className="space-y-1">
          <Label className="text-xs">CSS Output</Label>
          <div className="rounded border border-border bg-muted/50 p-2">
            <code className="text-xs font-mono break-all">
              background: {generateCss()};
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}