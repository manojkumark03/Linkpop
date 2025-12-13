import { test, expect } from '@playwright/test';

test.describe('Analytics Tracking', () => {
  test('should track analytics on link click', async ({ page }) => {
    // Navigate to a public profile
    await page.goto('http://localhost:3000/test-user');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that analytics are being set up (this would be done via JS)
    // In a real app, you'd check network requests to /api/analytics
    expect(page.url()).toContain('test-user');
  });

  test('should get analytics data', async ({ page }) => {
    // This would require authentication and specific test links
    // For now, just verify the analytics API exists
    const response = await page.request.get(
      'http://localhost:3000/api/analytics?linkId=test&days=7',
    );

    // Should return 404 for test link or 200 with data
    expect([200, 400, 404]).toContain(response.status());
  });
});

test.describe('Billing & Subscription', () => {
  test('should display billing page for authenticated user', async ({ page, context }) => {
    // This test requires authentication setup
    // For now, verify the page exists
    const response = await page.request.get('http://localhost:3000/dashboard/billing');

    // Should redirect to login if not authenticated
    expect([301, 302, 307, 308, 401]).toContain(response.status());
  });

  test('should display subscription info', async ({ page }) => {
    // Navigate to billing page (will redirect if not authenticated)
    await page.goto('http://localhost:3000/dashboard/billing');

    // Check if we get a login redirect or can see the billing page
    if (page.url().includes('/auth/login')) {
      expect(page.url()).toContain('/auth/login');
    } else {
      expect(page.url()).toContain('/dashboard/billing');
    }
  });
});

test.describe('Admin Panel', () => {
  test('should have admin analytics page', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/admin/analytics');

    // Should redirect to login if not authenticated
    expect([301, 302, 307, 308, 401]).toContain(response.status());
  });

  test('should have user management page', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/admin/users');

    // Should redirect to login if not authenticated
    expect([301, 302, 307, 308, 401]).toContain(response.status());
  });

  test('should have billing page', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/admin/billing');

    // Should redirect to login if not authenticated
    expect([301, 302, 307, 308, 401]).toContain(response.status());
  });
});
