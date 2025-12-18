'use client';

import { useEffect } from 'react';

export function PageViewTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    // Track the page view
    const trackView = async () => {
      try {
        await fetch(`/api/pages/${pageId}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        // Silently fail - don't interrupt the user experience if analytics fails
        console.error('Failed to track page view:', error);
      }
    };

    trackView();
  }, [pageId]);

  return null;
}
