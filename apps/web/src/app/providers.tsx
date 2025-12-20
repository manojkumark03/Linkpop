'use client';

import * as React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster, TooltipProvider } from '@acme/ui';

import { KeyboardShortcutsModal } from '@/components/modals/keyboard-shortcuts-modal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider delayDuration={150}>
          {children}
          <Toaster />
          <KeyboardShortcutsModal />
        </TooltipProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
