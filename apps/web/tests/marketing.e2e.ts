import { test, expect } from '@playwright/test';

test.describe('Marketing Site', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have correct page title and branding', async ({ page }) => {
    await expect(page).toHaveTitle(/Linkforest/);

    // Check if Linkforest branding is present
    await expect(page.locator('text=Linkforest')).toBeVisible();

    // Check if tagline is present
    await expect(page.locator('text=Grow your links. Own your audience.')).toBeVisible();
  });

  test('navigation should work correctly', async ({ page }) => {
    // Test main navigation links
    const navigationLinks = [
      { name: 'How it works', href: '/how-it-works' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Resources', href: '/resources' },
      { name: 'Contact', href: '/contact' },
    ];

    for (const link of navigationLinks) {
      await page.getByRole('link', { name: link.name }).click();
      await expect(page).toHaveURL(`*${link.href}`);
      await expect(page).toHaveTitle(new RegExp(link.name, 'i'));

      // Go back to home
      await page.goto('/');
    }
  });

  test('CTA buttons should route to auth', async ({ page }) => {
    // Test primary CTA button in hero
    await page.getByRole('button', { name: 'Start Building' }).click();
    await expect(page).toHaveURL(/.*\/auth\/register/);

    // Go back and test secondary CTA
    await page.goto('/');
    await page.getByRole('button', { name: 'Learn More' }).click();
    await expect(page).toHaveURL(/.*\/how-it-works/);

    // Test navigation CTAs
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).last().click();
    await expect(page).toHaveURL(/.*\/auth\/register/);
  });

  test('pricing table should be displayed correctly', async ({ page }) => {
    await page.goto('/pricing');

    // Check if pricing tiers are displayed
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Business')).toBeVisible();

    // Check if pricing information is present
    await expect(page.locator('$0')).toBeVisible();
    await expect(page.locator('$5')).toBeVisible();
    await expect(page.locator('$29')).toBeVisible();

    // Test CTA buttons in pricing cards
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page).toHaveURL(/.*\/auth\/register/);
  });

  test('contact form should validate and submit', async ({ page }) => {
    await page.goto('/contact');

    // Test form validation
    await page.getByRole('button', { name: 'Send message' }).click();

    // Check if validation errors appear
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page.locator('text=Message must be at least 10 characters')).toBeVisible();
    await expect(page.locator('text=You must agree to our terms')).toBeVisible();

    // Fill out the form
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page
      .getByLabel('Message')
      .fill('This is a test message to verify the contact form works correctly.');
    await page.getByLabel('I agree to the Terms of Service').check();

    // Submit the form
    await page.getByRole('button', { name: 'Send message' }).click();

    // Check for success message
    await expect(page.locator('text=Your message has been sent successfully!')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if mobile menu is present
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Test mobile navigation
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'How it works' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Resources' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  test('footer links should work', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Test footer links
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/.*\/about/);

    await page.goto('/');
    await page.evaluate(() => window.scrollTo(document.body.scrollHeight, 0));
    await page.getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(/.*\/privacy/);

    await page.goto('/');
    await page.evaluate(() => window.scrollTo(document.body.scrollHeight, 0));
    await page.getByRole('link', { name: 'Terms' }).click();
    await expect(page).toHaveURL(/.*\/terms/);
  });

  test('FAQ accordion should work', async ({ page }) => {
    await page.goto('/faq');

    // Test first FAQ item
    const firstQuestion = page.locator('button').filter({ hasText: /What is Linkforest/i });
    await firstQuestion.click();

    // Check if answer is visible
    await expect(page.locator('text=Linkforest is a link-in-bio platform')).toBeVisible();

    // Test another question
    const secondQuestion = page.locator('button').filter({ hasText: /How do I get started/i });
    await secondQuestion.click();

    await expect(page.locator('text=Getting started is easy')).toBeVisible();
  });
});
