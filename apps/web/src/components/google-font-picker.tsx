'use client';

import { useState, useMemo } from 'react';
import { Button, Input, Label } from '@acme/ui';
import { Search, ExternalLink } from 'lucide-react';
import { cn } from '@acme/ui';

// Popular Google Fonts with their display names
const googleFonts = [
  { family: 'Inter', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Inter' },
  { family: 'Roboto', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Roboto' },
  { family: 'Open Sans', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Open+Sans' },
  { family: 'Lato', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Lato' },
  { family: 'Montserrat', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Montserrat' },
  { family: 'Poppins', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Poppins' },
  { family: 'Source Sans Pro', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Source+Sans+Pro' },
  { family: 'Raleway', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Raleway' },
  { family: 'Nunito', category: 'Sans Serif', url: 'https://fonts.google.com/specimen/Nunito' },
  { family: 'Merriweather', category: 'Serif', url: 'https://fonts.google.com/specimen/Merriweather' },
  { family: 'Playfair Display', category: 'Serif', url: 'https://fonts.google.com/specimen/Playfair+Display' },
  { family: 'Lora', category: 'Serif', url: 'https://fonts.google.com/specimen/Lora' },
  { family: 'Georgia', category: 'Serif', url: 'https://fonts.google.com/specimen/Georgia' },
  { family: 'Times New Roman', category: 'Serif', url: 'https://fonts.google.com/specimen/Times+New+Roman' },
  { family: 'Roboto Slab', category: 'Serif', url: 'https://fonts.google.com/specimen/Roboto+Slab' },
  { family: 'Fira Code', category: 'Monospace', url: 'https://fonts.google.com/specimen/Fira+Code' },
  { family: 'Source Code Pro', category: 'Monospace', url: 'https://fonts.google.com/specimen/Source+Code+Pro' },
  { family: 'JetBrains Mono', category: 'Monospace', url: 'https://fonts.google.com/specimen/JetBrains+Mono' },
  { family: 'Inconsolata', category: 'Monospace', url: 'https://fonts.google.com/specimen/Inconsolata' },
  { family: 'Courier New', category: 'Monospace', url: 'https://fonts.google.com/specimen/Courier+New' },
];

interface GoogleFontPickerProps {
  currentFont?: string;
  onFontChange: (fontFamily: string) => void;
  className?: string;
}

export function GoogleFontPicker({
  currentFont,
  onFontChange,
  className,
}: GoogleFontPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = ['All', 'Sans Serif', 'Serif', 'Monospace'];

  const filteredFonts = useMemo(() => {
    return googleFonts.filter((font) => {
      const matchesSearch = font.family.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || font.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const currentFontDisplay = googleFonts.find((font) => font.family === currentFont);

  const getFontCSS = (fontFamily: string) => {
    return `"${fontFamily}", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  };

  const handleFontSelect = (fontFamily: string) => {
    onFontChange(fontFamily);
    setIsExpanded(false);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1">
        <Label className="text-sm font-medium">Font Family</Label>
        {!isExpanded ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex-1">
                {currentFontDisplay ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{currentFontDisplay.family}</div>
                    <div className="text-xs text-muted-foreground">
                      {currentFontDisplay.category}
                    </div>
                    <div
                      className="text-sm"
                      style={{ fontFamily: getFontCSS(currentFontDisplay.family) }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Default System Font</div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
              >
                Browse
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search fonts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsExpanded(false);
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                Done
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'whitespace-nowrap rounded-lg border border-border px-3 py-1 text-xs font-medium transition-colors',
                    selectedCategory === category
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent',
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Font Grid */}
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {filteredFonts.map((font) => (
                <button
                  key={font.family}
                  type="button"
                  onClick={() => handleFontSelect(font.family)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent',
                    currentFont === font.family && 'border-primary bg-primary/5',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium">{font.family}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{font.category}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div
                    className="text-sm"
                    style={{ fontFamily: getFontCSS(font.family) }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </button>
              ))}
            </div>

            {filteredFonts.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No fonts found matching your search.
              </div>
            )}
          </div>
        )}
      </div>

      {currentFontDisplay && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground mb-2">CSS Preview:</div>
          <code className="text-xs font-mono break-all">
            font-family: {getFontCSS(currentFontDisplay.family)};
          </code>
        </div>
      )}
    </div>
  );
}