'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

import { Button } from '@acme/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileMenu } from '@/components/marketing/mobile-menu';
import { Footer } from '@/components/marketing/footer';
import { siteConfig } from '@/lib/site-config';

function isPublicProfilePath(pathname: string) {
  if (pathname === '/') return false;
  if (pathname.startsWith('/auth')) return false;
  if (pathname.startsWith('/dashboard')) return false;
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/api')) return false;

  const segments = pathname.split('/').filter(Boolean);

  // Public profile paths can be:
  // 1. Single segment: /username
  // 2. Two segments: /username/page-slug (for markdown pages)
  return segments.length === 1 || segments.length === 2;
}

function isMarketingPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/how-it-works') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/resources') ||
    pathname.startsWith('/blog')
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isPublicProfile = isPublicProfilePath(pathname);
  const isMarketing = isMarketingPath(pathname);

  if (isPublicProfile) {
    return <div className="min-h-screen">{children}</div>;
  }

  if (isMarketing) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">L</span>
              </div>
              <span className="text-xl font-bold">{siteConfig.name}</span>
            </Link>

            <nav className="hidden items-center space-x-6 md:flex">
              {siteConfig.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hover:text-primary text-sm font-medium transition-colors ${
                    pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center space-x-4 md:flex">
              {session?.user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={() => void signOut({ callbackUrl: '/' })}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/register">{siteConfig.cta.primary.text}</Link>
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>

            <div className="flex items-center space-x-4 md:hidden">
              <ThemeToggle />
              <MobileMenu />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-semibold">
            {siteConfig.name}
          </Link>

          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={() => void signOut({ callbackUrl: '/' })}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">{siteConfig.cta.primary.text}</Link>
                </Button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}
