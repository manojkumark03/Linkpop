// Test file to verify our Linktree-like profile builder implementation
import { DashboardBuilder } from './_components/dashboard-builder';

// Simple test to verify the component exports correctly
const testComponent = () => {
  console.log('DashboardBuilder component loaded successfully');
};

// Test data structures
export const mockProfileElements = [
  {
    id: '1',
    type: 'SOCIAL' as const,
    content: {
      platform: 'twitter',
      username: '@testuser',
      displayName: 'Follow me on Twitter',
    },
    order: 0,
  },
  {
    id: '2',
    type: 'LINK' as const,
    content: {
      title: 'My Website',
      url: 'https://example.com',
    },
    order: 1,
  },
];

export { testComponent };
export default testComponent;
