'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@acme/ui';
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Facebook,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Music,
  Video,
  Book,
  ShoppingBag,
  Heart,
  Star,
  Camera,
  Palette,
  Code,
  Gamepad2,
  Coffee,
} from 'lucide-react';
import { cn } from '@acme/ui';

interface SocialIconPreset {
  id: string;
  name: string;
  icon: any;
  url: string;
  color: string;
  category: string;
}

const socialIconPresets: SocialIconPreset[] = [
  // Social Platforms
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, url: 'https://twitter.com/', color: '#1DA1F2', category: 'social' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, url: 'https://linkedin.com/in/', color: '#0077B5', category: 'social' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, url: 'https://instagram.com/', color: '#E4405F', category: 'social' },
  { id: 'github', name: 'GitHub', icon: Github, url: 'https://github.com/', color: '#333', category: 'social' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, url: 'https://youtube.com/', color: '#FF0000', category: 'social' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, url: 'https://facebook.com/', color: '#1877F2', category: 'social' },
  
  // Communication
  { id: 'email', name: 'Email', icon: Mail, url: 'mailto:', color: '#666', category: 'communication' },
  { id: 'phone', name: 'Phone', icon: Phone, url: 'tel:', color: '#666', category: 'communication' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, url: 'https://wa.me/', color: '#25D366', category: 'communication' },
  { id: 'telegram', name: 'Telegram', icon: MessageCircle, url: 'https://t.me/', color: '#0088CC', category: 'communication' },
  
  // Professional
  { id: 'website', name: 'Website', icon: Globe, url: 'https://', color: '#6366f1', category: 'professional' },
  { id: 'portfolio', name: 'Portfolio', icon: Globe, url: 'https://', color: '#8b5cf6', category: 'professional' },
  { id: 'blog', name: 'Blog', icon: Book, url: 'https://', color: '#06b6d4', category: 'professional' },
  
  // Lifestyle
  { id: 'location', name: 'Location', icon: MapPin, url: 'https://maps.google.com/', color: '#ef4444', category: 'lifestyle' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, url: 'https://calendly.com/', color: '#3b82f6', category: 'lifestyle' },
  { id: 'music', name: 'Music', icon: Music, url: 'https://music.apple.com/', color: '#f97316', category: 'lifestyle' },
  { id: 'video', name: 'Videos', icon: Video, url: 'https://', color: '#f59e0b', category: 'lifestyle' },
  
  // Creative
  { id: 'camera', name: 'Photography', icon: Camera, url: 'https://', color: '#84cc16', category: 'creative' },
  { id: 'design', name: 'Design', icon: Palette, url: 'https://', color: '#ec4899', category: 'creative' },
  { id: 'code', name: 'Coding', icon: Code, url: 'https://', color: '#14b8a6', category: 'creative' },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, url: 'https://', color: '#6366f1', category: 'creative' },
  
  // Business
  { id: 'shop', name: 'Shop', icon: ShoppingBag, url: 'https://', color: '#059669', category: 'business' },
  { id: 'support', name: 'Support', icon: Heart, url: 'https://', color: '#dc2626', category: 'business' },
  { id: 'reviews', name: 'Reviews', icon: Star, url: 'https://', color: '#fbbf24', category: 'business' },
  { id: 'coffee', name: 'Coffee Chat', icon: Coffee, url: 'https://', color: '#92400e', category: 'business' },
];

interface SocialIconPresetsProps {
  onSelectPreset: (preset: SocialIconPreset) => void;
  className?: string;
}

export function SocialIconPresets({
  onSelectPreset,
  className,
}: SocialIconPresetsProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'social', name: 'Social' },
    { id: 'communication', name: 'Communication' },
    { id: 'professional', name: 'Professional' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'creative', name: 'Creative' },
    { id: 'business', name: 'Business' },
  ];

  const filteredPresets = socialIconPresets.filter((preset) => {
    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
    const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Quick Add Links</Label>
        <Input
          placeholder="Search presets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors',
              selectedCategory === category.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-accent',
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
        {filteredPresets.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className="flex items-center gap-2 rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded"
                style={{ backgroundColor: preset.color + '20' }}
              >
                <Icon className="h-4 w-4" style={{ color: preset.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{preset.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{preset.category}</div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredPresets.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          No presets found matching your search.
        </div>
      )}
    </div>
  );
}