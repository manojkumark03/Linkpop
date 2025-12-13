'use client';

import Image from 'next/image';
import type { Prisma } from '@prisma/client';
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@acme/ui';

import type { ThemeSettings } from '@/lib/theme-settings';
import { isLinkVisible } from '@/lib/link-visibility';

export type PreviewProfile = {
  slug: string;
  displayName: string | null;
  bio: string | null;
  image: string | null;
  themeSettings: ThemeSettings;
};

export type PreviewLink = {
  id: string;
  title: string;
  url: string;
  status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
  deletedAt?: Date | null;
  metadata: Prisma.JsonValue;
};

const iconMap: Record<string, LucideIcon> = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  globe: Globe,
};

function getLinkMetadata(link: PreviewLink): Record<string, any> {
  if (!link.metadata || typeof link.metadata !== 'object') return {};
  return link.metadata as Record<string, any>;
}

export function ProfilePreview({
  profile,
  links,
  className,
  showQr,
}: {
  profile: PreviewProfile;
  links: PreviewLink[];
  className?: string;
  showQr?: boolean;
}) {
  const theme = profile.themeSettings;

  const visibleLinks = links.filter((l) =>
    isLinkVisible({
      status: l.status,
      deletedAt: l.deletedAt ?? null,
      metadata: l.metadata,
    }),
  );

  const socialLinks = visibleLinks.filter((l) => {
    const md = getLinkMetadata(l);
    return md.display === 'icon' && typeof md.icon === 'string' && md.icon.length > 0;
  });

  const buttonLinks = visibleLinks.filter((l) => {
    const md = getLinkMetadata(l);
    return md.display !== 'icon';
  });

  return (
    <div
      className={cn('flex min-h-screen items-center justify-center p-6', className)}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily || undefined,
      }}
    >
      {theme.customCss ? <style dangerouslySetInnerHTML={{ __html: theme.customCss }} /> : null}

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {profile.image ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/15">
              <Image src={profile.image} alt="Profile avatar" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/5 text-2xl font-semibold">
              {(profile.displayName || profile.slug).slice(0, 1).toUpperCase()}
            </div>
          )}

          <h1 className="mt-4 text-2xl font-bold">{profile.displayName || profile.slug}</h1>
          {profile.bio ? <p className="mt-2 text-sm opacity-90">{profile.bio}</p> : null}

          {socialLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {socialLinks.map((l) => {
                const md = getLinkMetadata(l);
                const Icon = md.icon ? iconMap[String(md.icon).toLowerCase()] : null;
                return (
                  <a
                    key={l.id}
                    href={`/api/links/${l.id}/click`}
                    aria-label={l.title}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    {Icon ? <Icon className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-8 space-y-3">
          {buttonLinks.map((l) => (
            <a
              key={l.id}
              href={`/api/links/${l.id}/click`}
              className="block w-full px-4 py-3 text-center text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
                borderRadius: theme.buttonRadius,
              }}
            >
              {l.title}
            </a>
          ))}
        </div>

        {showQr ? (
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="text-xs opacity-80">Scan to share</div>
            <Image
              src={`/api/qr?slug=${encodeURIComponent(profile.slug)}`}
              alt="QR code"
              width={160}
              height={160}
              className="h-40 w-40 rounded bg-white p-2"
              unoptimized
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
