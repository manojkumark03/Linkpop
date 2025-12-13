import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

import { ThemeToggle } from '@/components/theme-toggle';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Next.js 14 Starter',
  description: 'Production-ready Next.js 14 + Tailwind + Prisma + NextAuth starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen">
            <header className="border-b">
              <div className="container flex h-16 items-center justify-between">
                <div className="font-semibold">Next.js 14 Starter</div>
                <ThemeToggle />
              </div>
            </header>
            <main className="container py-10">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
