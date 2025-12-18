'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@acme/ui';
import { ThemeSettings } from '@/lib/theme-settings';
import { ProfilePreview } from './profile-preview';
import { useRouter } from 'next/navigation';

interface Link {
  id: string;
  title: string;
  url: string;
}

interface Profile {
  id: string;
  slug: string;
  displayName: string | null;
  bio: string | null;
  image: string | null;
  themeSettings: ThemeSettings;
}

interface DesignEditorProps {
  profile: Profile;
  links: Link[];
}

const themePresets = [
  {
    name: 'Minimal',
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#000000',
      buttonTextColor: '#ffffff',
      buttonRadius: 8,
      fontFamily: 'Outfit',
    },
  },
  {
    name: 'Bold',
    theme: {
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      buttonColor: '#e94560',
      buttonTextColor: '#ffffff',
      buttonRadius: 12,
      fontFamily: 'Poppins',
    },
  },
  {
    name: 'Gradient',
    theme: {
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      buttonColor: '#ffffff',
      buttonTextColor: '#667eea',
      buttonRadius: 20,
      fontFamily: 'Montserrat',
    },
  },
  {
    name: 'Dark',
    theme: {
      backgroundColor: '#0b1220',
      textColor: '#ffffff',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      buttonRadius: 12,
      fontFamily: 'Outfit',
    },
  },
  {
    name: 'Neon',
    theme: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      buttonColor: '#00ff88',
      buttonTextColor: '#000000',
      buttonRadius: 0,
      fontFamily: 'Space Grotesk',
    },
  },
  {
    name: 'Professional',
    theme: {
      backgroundColor: '#f8f9fa',
      textColor: '#212529',
      buttonColor: '#0d6efd',
      buttonTextColor: '#ffffff',
      buttonRadius: 6,
      fontFamily: 'Roboto',
    },
  },
];

const fontOptions = [
  'Outfit',
  'Inter',
  'Poppins',
  'Playfair Display',
  'Montserrat',
  'Roboto',
  'Space Grotesk',
];

function getFontVariable(fontFamily?: string): string {
  if (!fontFamily) return 'var(--font-outfit)';
  const fontMap: Record<string, string> = {
    Outfit: 'var(--font-outfit)',
    Inter: 'var(--font-inter)',
    Poppins: 'var(--font-poppins)',
    'Playfair Display': 'var(--font-playfair-display)',
    Montserrat: 'var(--font-montserrat)',
    Roboto: 'var(--font-roboto)',
    'Space Grotesk': 'var(--font-space-grotesk)',
  };
  return fontMap[fontFamily] || 'var(--font-outfit)';
}

export function DesignEditor({ profile, links }: DesignEditorProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<ThemeSettings>(profile.themeSettings);
  const [avatarUrl, setAvatarUrl] = useState(profile.image || '');
  const [saving, setSaving] = useState(false);

  const handlePresetClick = (preset: (typeof themePresets)[0]) => {
    setSettings({ ...settings, ...preset.theme });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/profiles/${profile.id}/design`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeSettings: settings,
          image: avatarUrl || null,
        }),
      });

      if (response.ok) {
        toast({ title: 'Saving changes…', description: 'Your design has been updated.' });
        router.refresh();
      } else {
        const data = await response.json().catch(() => null);
        toast({
          title: 'Save failed',
          description: data?.error || 'Could not save changes',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(profile.themeSettings);
    setAvatarUrl(profile.image || '');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme Presets</CardTitle>
            <CardDescription>Quick start with a pre-designed theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {themePresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => handlePresetClick(preset)}
                >
                  <div
                    className="h-12 w-full rounded"
                    style={{
                      background: preset.theme.backgroundColor,
                      border: '2px solid #e5e7eb',
                    }}
                  />
                  <span className="text-xs font-medium">{preset.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>Customize your color scheme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bgColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="bgColor"
                  type="color"
                  value={
                    settings.backgroundColor?.startsWith('#') ? settings.backgroundColor : '#0b1220'
                  }
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={settings.backgroundColor || ''}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  placeholder="#0b1220 or gradient"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonColor">Button Color</Label>
              <div className="flex gap-2">
                <Input
                  id="buttonColor"
                  type="color"
                  value={settings.buttonColor || '#ffffff'}
                  onChange={(e) => setSettings({ ...settings, buttonColor: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={settings.buttonColor || ''}
                  onChange={(e) => setSettings({ ...settings, buttonColor: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={settings.textColor || '#ffffff'}
                  onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={settings.textColor || ''}
                  onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Choose your font style</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="font">Font Family</Label>
              <Select
                value={settings.fontFamily || 'Outfit'}
                onValueChange={(value) => setSettings({ ...settings, fontFamily: value })}
              >
                <SelectTrigger id="font">
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem
                      key={font}
                      value={font}
                      style={{ fontFamily: getFontVariable(font) }}
                    >
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>Set your profile image URL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="avatar">Image URL</Label>
              <Input
                id="avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://i.ibb.co/your-image.jpg"
              />
              <p className="text-muted-foreground text-xs">
                Upload to ImgBB or use any direct image URL
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your profile looks</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfilePreview
              profile={{
                ...profile,
                image: avatarUrl,
              }}
              links={links}
              settings={settings}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
