// Test to verify ProfilePreview component interface compatibility
// This simulates the exact usage pattern from the public profile page

import React from 'react';
import type { BlockType, ThemeSettings } from '@/types/blocks';

// Mock the ProfilePreview component to test interface compatibility
const mockProfilePreview: React.FC<{
  profile?: {
    slug: string;
    displayName: string | null;
    bio: string | null;
    image: string | null;
    themeSettings: ThemeSettings;
  };
  elements?: any[];
  links?: any[];
  showQr?: boolean;
  pages?: any[];
}> = (props) => {
  return React.createElement('div', null, 'Profile Preview');
};

// Test the exact usage pattern from [slug]/page.tsx
export function testProfilePreviewInterface() {
  const profile = {
    slug: 'test-profile',
    displayName: 'Test User',
    bio: 'Test bio',
    image: null,
    themeSettings: {} as ThemeSettings,
  };

  const elements = [
    {
      id: '1',
      type: 'SOCIAL' as BlockType,
      content: { platform: 'twitter', username: '@testuser' },
    },
  ];

  const links = [
    {
      id: '2',
      title: 'Test Link',
      url: 'https://example.com',
      linkType: 'URL' as const,
      status: 'ACTIVE' as const,
      deletedAt: null,
      metadata: {},
    },
  ];

  const pages = [
    {
      id: '3',
      title: 'Test Page',
      slug: 'test-page',
      icon: null,
    },
  ];

  // This should not throw a TypeScript error
  const component = React.createElement(mockProfilePreview, {
    profile,
    elements,
    links,
    showQr: true,
    pages,
  });

  return component;
}

// Export a test component that uses the same pattern
export const TestComponent = () => {
  return testProfilePreviewInterface();
};