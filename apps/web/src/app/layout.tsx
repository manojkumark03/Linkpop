import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

import { AppShell } from '@/components/app-shell';
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
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
