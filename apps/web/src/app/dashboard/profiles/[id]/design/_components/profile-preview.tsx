'use client';

import { ThemeSettings } from '@/lib/theme-settings';

interface Link {
  id: string;
  title: string;
  url: string;
}

interface Profile {
  slug: string;
  displayName: string | null;
  bio: string | null;
  image: string | null;
}

interface ProfilePreviewProps {
  profile: Profile;
  links: Link[];
  settings: ThemeSettings;
}

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

export function ProfilePreview({ profile, links, settings }: ProfilePreviewProps) {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <div
        className="flex min-h-[600px] flex-col items-center justify-center p-8"
        style={{
          background: settings.backgroundColor || '#0b1220',
          color: settings.textColor || '#ffffff',
          fontFamily: getFontVariable(settings.fontFamily),
        }}
      >
        {profile.image && (
          <div className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.image}
              alt={profile.displayName || profile.slug}
              className="h-24 w-24 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <h1 className="mb-2 text-2xl font-bold">{profile.displayName || profile.slug}</h1>

        {profile.bio && <p className="mb-6 max-w-md text-center opacity-80">{profile.bio}</p>}

        <div className="w-full max-w-md space-y-3">
          {links.length === 0 ? (
            <div className="text-center opacity-60">
              <p className="text-sm">No links yet</p>
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="w-full px-6 py-3 text-center font-medium transition-transform hover:scale-105"
                style={{
                  backgroundColor: settings.buttonColor || '#ffffff',
                  color: settings.buttonTextColor || '#0b1220',
                  borderRadius: `${settings.buttonRadius || 12}px`,
                }}
              >
                {link.title}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
