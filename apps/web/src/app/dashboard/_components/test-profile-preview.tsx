'use client';

// Simple test component to verify our ProfilePreview interface works
import { ProfilePreview } from '@/components/profile-preview';

// Mock data that matches both interfaces
const testLegacyProps = {
  profile: {
    slug: 'test-profile',
    displayName: 'Test User',
    bio: 'This is a test bio',
    image: null,
    themeSettings: {},
  },
  elements: [
    {
      id: '1',
      type: 'SOCIAL',
      content: {
        platform: 'twitter',
        username: '@testuser',
        displayName: 'Follow me on Twitter'
      }
    },
    {
      id: '2',
      type: 'LINK',
      content: {
        title: 'My Website',
        url: 'https://example.com'
      }
    }
  ],
  links: [
    {
      id: '3',
      title: 'Legacy Link',
      url: 'https://legacy.com',
      linkType: 'URL' as const,
      status: 'ACTIVE',
      deletedAt: null,
      metadata: {}
    }
  ],
  showQr: true,
  pages: []
};

const testNewProps = {
  profileId: 'profile-123',
  blocks: [
    {
      id: '1',
      parentId: 'profile-123',
      parentType: 'PROFILE' as const,
      type: 'SOCIAL' as const,
      order: 0,
      content: {
        platform: 'twitter',
        username: '@testuser',
        displayName: 'Follow me on Twitter'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

export function TestProfilePreview() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Test Legacy Interface</h2>
        <ProfilePreview {...testLegacyProps} />
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Test New Interface</h2>
        <ProfilePreview {...testNewProps} />
      </div>
    </div>
  );
}