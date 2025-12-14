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
  showShareBar,
}: {
  profile: PreviewProfile;
  links: PreviewLink[];
  className?: string;
  showQr?: boolean;
  showShareBar?: boolean;
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

  // Generate background styles
  const generateBackgroundStyle = () => {
    const { backgroundStyle, backgroundColor, backgroundImageUrl, gradientStops, gradientAngle } = theme;
    
    switch (backgroundStyle) {
      case 'gradient':
        if (gradientStops && gradientStops.length >= 2) {
          const gradientString = gradientStops
            .map(stop => `${stop.color} ${stop.position}%`)
            .join(', ');
          return `linear-gradient(${gradientAngle || 45}deg, ${gradientString})`;
        }
        return backgroundColor || '#0b1220';
      
      case 'image':
        return backgroundImageUrl ? `url(${backgroundImageUrl})` : backgroundColor || '#0b1220';
      
      default:
        return backgroundColor || '#0b1220';
    }
  };

  // Generate button styles
  const getButtonStyles = (link: PreviewLink) => {
    const { buttonVariant, buttonColor, buttonTextColor, buttonRadius, buttonShadow } = theme;
    const md = getLinkMetadata(link);
    
    const baseStyles = {
      borderRadius: buttonRadius || 12,
      fontFamily: theme.fontFamily || undefined,
      textTransform: theme.textTransform || 'none' as const,
    };

    switch (buttonVariant) {
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: buttonTextColor || buttonColor || '#ffffff',
          border: `2px solid ${buttonColor || '#ffffff'}`,
          boxShadow: buttonShadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
        };
      
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: buttonTextColor || buttonColor || '#ffffff',
          border: 'none',
          boxShadow: 'none',
        };
      
      default: // solid
        return {
          ...baseStyles,
          backgroundColor: buttonColor || '#ffffff',
          color: buttonTextColor || '#0b1220',
          border: 'none',
          boxShadow: buttonShadow ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
        };
    }
  };

  // Get scheduled link badge info
  const getScheduledBadge = (link: PreviewLink) => {
    const md = getLinkMetadata(link);
    const schedule = md.schedule as { startsAt?: string; endsAt?: string } | undefined;
    if (!schedule) return null;

    const now = new Date();
    const startsAt = schedule.startsAt ? new Date(schedule.startsAt) : null;
    const endsAt = schedule.endsAt ? new Date(schedule.endsAt) : null;

    if (startsAt && now < startsAt) {
      return { text: `Starts ${startsAt.toLocaleDateString()}`, color: 'bg-blue-500' };
    }
    if (endsAt && now > endsAt) {
      return { text: 'Expired', color: 'bg-gray-500' };
    }
    if (startsAt && endsAt) {
      return { text: 'Scheduled', color: 'bg-green-500' };
    }
    return null;
  };

  return (
    <div
      className={cn('relative flex min-h-screen items-center justify-center p-6', className)}
      style={{
        background: generateBackgroundStyle(),
        backgroundSize: theme.backgroundStyle === 'image' ? 'cover' : 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: theme.textColor || '#ffffff',
        fontFamily: theme.fontFamily || undefined,
      }}
    >
      {/* Background overlay for better text readability */}
      {((theme.backgroundStyle === 'image' || theme.backgroundStyle === 'gradient') && theme.backgroundOverlayOpacity !== undefined) && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: theme.backgroundOverlayOpacity }}
        />
      )}
      
      {theme.customCss ? <style dangerouslySetInnerHTML={{ __html: theme.customCss }} /> : null}

      <div className="relative z-10 w-full max-w-md">
        {/* Share Bar */}
        {showShareBar && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <ShareButtons slug={profile.slug} />
          </div>
        )}

        {/* Profile Header */}
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

          <h1 className="mt-4 text-2xl font-bold" style={{ textTransform: theme.textTransform || 'none' }}>
            {profile.displayName || profile.slug}
          </h1>
          {profile.bio ? (
            <p 
              className="mt-2 text-sm opacity-90" 
              style={{ textTransform: theme.textTransform || 'none' }}
            >
              {profile.bio}
            </p>
          ) : null}

          {/* Social Links */}
          {socialLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {socialLinks.map((l) => {
                const md = getLinkMetadata(l);
                const Icon = md.icon ? iconMap[String(md.icon).toLowerCase()] : null;
                const scheduledBadge = getScheduledBadge(l);
                
                return (
                  <div key={l.id} className="relative">
                    <a
                      href={`/api/links/${l.id}/click`}
                      aria-label={l.title}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                    >
                      {Icon ? <Icon className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                    </a>
                    {scheduledBadge && (
                      <div className={cn('absolute -top-1 -right-1 rounded-full px-1 py-0.5 text-xs font-medium text-white', scheduledBadge.color)}>
                        ⏰
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Button Links */}
        <div className="mt-8 space-y-3">
          {buttonLinks.map((l) => {
            const scheduledBadge = getScheduledBadge(l);
            
            return (
              <div key={l.id} className="relative">
                <a
                  href={`/api/links/${l.id}/click`}
                  className="block w-full px-4 py-3 text-center text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/40 hover:scale-[1.02]"
                  style={getButtonStyles(l)}
                  styleTextTransform={theme.textTransform || 'none'}
                >
                  {l.title}
                </a>
                {scheduledBadge && (
                  <div className="absolute -top-2 -right-2 rounded-full px-2 py-1 text-xs font-medium text-white shadow-lg" style={{ backgroundColor: scheduledBadge.color.replace('bg-', '') }}>
                    {scheduledBadge.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* QR Code */}
        {showQr && (
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
        )}
      </div>
    </div>
  );
}

function ShareButtons({ slug }: { slug: string }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://example.com/${slug}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent('Check out my profile!');

  const shareLinks = [
    {
      name: 'Copy Link',
      icon: '📋',
      action: () => {
        if (navigator.share) {
          navigator.share({ url: shareUrl, title: 'My Profile' });
        } else {
          navigator.clipboard.writeText(shareUrl);
        }
      },
    },
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  return (
    <>
      {shareLinks.map((link) => (
        <button
          key={link.name}
          type="button"
          onClick={() => link.action?.() || (link.url && window.open(link.url, '_blank'))}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          title={`Share on ${link.name}`}
        >
          <span>{link.icon}</span>
          <span className="hidden sm:inline">{link.name}</span>
        </button>
      ))}
    </>
  );
}
