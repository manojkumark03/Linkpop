'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Copy,
  ChevronRight,
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

export type PreviewPage = {
  id: string;
  title: string;
  slug: string;
};

export type PreviewLink = {
  id: string;
  title: string;
  url: string;
  linkType: 'URL' | 'COPY_FIELD';
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

export function ProfilePreview({
  profile,
  links,
  pages = [],
  className,
  showQr,
}: {
  profile: PreviewProfile;
  links: PreviewLink[];
  pages?: PreviewPage[];
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
      style={
        {
          background: theme.backgroundColor,
          color: theme.textColor,
          fontFamily: getFontVariable(theme.fontFamily),
          colorScheme: 'light',
        } as React.CSSProperties
      }
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
          {buttonLinks.map((l) => {
            if (l.linkType === 'COPY_FIELD') {
              // Render copy field UI
              return (
                <div key={l.id} className="group">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 p-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {l.metadata && typeof l.metadata === 'object' && (l.metadata as any).icon && (
                        <div className="rounded-lg bg-white/10 p-2">
                          <Globe className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-sm font-medium">{l.title}</p>
                        <input
                          type="text"
                          value={l.url}
                          readOnly
                          className="w-full cursor-text border-0 bg-transparent text-sm opacity-90 outline-none"
                          onClick={(e) => e.currentTarget.select()}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(l.url);
                        // You could add a toast here
                      }}
                      className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                      style={{
                        color: theme.buttonTextColor,
                      }}
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                </div>
              );
            }

            // Regular clickable link
            return (
              <a
                key={l.id}
                href={`/api/links/${l.id}/click`}
                className="block w-full px-4 py-3 text-center text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                style={{
                  background: theme.buttonColor,
                  color: theme.buttonTextColor,
                  borderRadius: theme.buttonRadius,
                }}
              >
                {l.title}
              </a>
            );
          })}
        </div>

        {/* Pages Section */}
        {pages.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold">Pages</h2>
            <div className="space-y-3">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/${profile.slug}/${page.slug}`}
                  className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 p-3 transition-colors hover:bg-white/10"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <span className="font-medium">{page.title}</span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        )}

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
