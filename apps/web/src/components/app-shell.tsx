'use client';

import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@/components/theme-toggle';

function isPublicProfilePath(pathname: string) {
  if (pathname === '/') return false;
  if (pathname.startsWith('/auth')) return false;
  if (pathname.startsWith('/dashboard')) return false;
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/api')) return false;

  return pathname.split('/').filter(Boolean).length === 1;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicProfile = isPublicProfilePath(pathname);

  if (isPublicProfile) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-semibold">Next.js 14 Starter</div>
          <ThemeToggle />
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}
