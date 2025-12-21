'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Prisma } from '@prisma/client';
import * as LucideIcons from 'lucide-react';
import {
  ChevronRight,
  Globe,
  type LucideIcon,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Copy,
} from 'lucide-react';

import { cn, toast } from '@acme/ui';

import type { ThemeSettings } from '@/lib/theme-settings';
import { isLinkVisible } from '@/lib/link-visibility';
import { BlockListRenderer, BlockRenderer } from '@/components/block-renderer';
import type { Block, PageInfo } from '@/types/blocks';

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
  icon?: string | null;
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

export type PreviewPageWithBlocks = PageInfo & {
  blocks?: Block[];
};

export type PreviewElement = Block & {
  page?: PreviewPageWithBlocks | null;
};

const legacyIconMap: Record<string, LucideIcon> = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  globe: Globe,
};

const LEGACY_ICON_NAME_MAP: Record<string, string> = {
  github: 'Github',
  twitter: 'Twitter',
  linkedin: 'Linkedin',
  instagram: 'Instagram',
  youtube: 'Youtube',
  website: 'Globe',
  globe: 'Globe',
  link: 'Link',
};

function resolveLucideIcon(iconName?: string | null): LucideIcon | null {
  if (!iconName) return null;
  const normalized = LEGACY_ICON_NAME_MAP[iconName.toLowerCase()] ?? iconName;
  const Icon = (LucideIcons as Record<string, unknown>)[normalized];
  return typeof Icon === 'function' ? (Icon as LucideIcon) : null;
}

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
  elements,
  className,
  showQr,
}: {
  profile: PreviewProfile;
  links: PreviewLink[];
  pages?: PreviewPage[];
  elements?: PreviewElement[];
  className?: string;
  showQr?: boolean;
}) {
  const theme = profile.themeSettings;

  // New element-based rendering
  if (elements && elements.length > 0) {
    const sorted = [...elements].sort((a, b) => a.order - b.order);

    return (
      <div
        className={cn('flex min-h-screen items-center justify-center p-6', className)}
        style={
          {
            background: theme.backgroundColor,
            color: theme.textColor,
            fontFamily: getFontVariable(theme.fontFamily),
            colorScheme: 'light',
          } as CSSProperties
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
          </div>

          <div className="mt-8 space-y-4">
            {sorted.map((el) => {
              if (el.type === 'PAGE') {
                const page = el.page;
                if (!page || !page.isPublished) return null;

                const PageIcon = resolveLucideIcon(page.icon);

                return (
                  <div
                    key={el.id}
                    className="rounded-xl border border-white/15 bg-white/5 p-4"
                    style={{ borderRadius: theme.buttonRadius }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold">
                        {PageIcon ? <PageIcon className="h-4 w-4" /> : null}
                        <span className="truncate">{page.title}</span>
                      </div>
                      <Link
                        href={`/${profile.slug}/${page.slug}`}
                        className="text-sm opacity-80 transition-opacity hover:opacity-100"
                      >
                        Open <ChevronRight className="inline h-4 w-4" />
                      </Link>
                    </div>

                    <BlockListRenderer blocks={page.blocks ?? []} isPreview={false} isInteractive={true} />
                  </div>
                );
              }

              return <BlockRenderer key={el.id} block={el} isPreview={false} isInteractive={true} />;
            })}
          </div>

          {showQr ? (
            <div className="mt-10 text-center text-xs opacity-60">QR code coming soon</div>
          ) : null}
        </div>
      </div>
    );
  }

  // Legacy rendering (links + pages)
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
          } as CSSProperties
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
                const Icon = md.icon ? legacyIconMap[String(md.icon).toLowerCase()] : null;
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
            const md = getLinkMetadata(l);
            const iconKey = md.icon ? String(md.icon).toLowerCase() : '';
            const Icon = iconKey ? (legacyIconMap[iconKey] ?? Globe) : null;

            if (l.linkType === 'COPY_FIELD') {
              return (
                <div key={l.id} className="group">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 p-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {Icon ? (
                        <div className="rounded-lg bg-white/10 p-2">
                          <Icon className="h-4 w-4" />
                        </div>
                      ) : null}
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
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(l.url);
                          toast({
                            title: 'Copied!',
                            description: `${l.title} copied to clipboard`,
                          });
                        } catch {
                          toast({
                            title: 'Failed to copy',
                            description: 'Please try again',
                            variant: 'destructive',
                          });
                        }
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
                <span className="flex items-center justify-center gap-2">
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span className="truncate">{l.title}</span>
                </span>
              </a>
            );
          })}
        </div>

        {pages.length > 0 ? (
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
                  <span className="flex items-center gap-2 font-medium">
                    {page.icon && <span className="text-lg">{page.icon}</span>}
                    {page.title}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {showQr ? (
          <div className="mt-10 text-center text-xs opacity-60">QR code coming soon</div>
        ) : null}
      </div>
    </div>
  );
}
