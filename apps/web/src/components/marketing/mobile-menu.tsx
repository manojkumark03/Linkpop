'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { Button } from '@acme/ui';
import { siteConfig } from '@/lib/site-config';

interface MobileMenuProps {
  className?: string;
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = siteConfig.navigation;

  return (
    <div className={className}>
      <button
        className="text-muted-foreground hover:text-primary hover:bg-muted inline-flex items-center justify-center rounded-md p-2 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="bg-background absolute left-0 right-0 top-full border-b shadow-lg md:hidden">
          <div className="container space-y-4 py-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col space-y-2 border-t pt-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                  {siteConfig.cta.primary.text}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
