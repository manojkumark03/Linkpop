import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('text=Create Account')).toBeVisible();
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('text=Sign up');
    await expect(page).toHaveURL('/auth/register');

    await page.click('text=Sign in');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('text=Forgot password?');
    await expect(page).toHaveURL('/auth/forgot-password');
    await expect(page.locator('text=Forgot Password')).toBeVisible();
  });

  test('should show validation error for invalid email on login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should show validation error for short password on register', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[id="name"]', 'Test User');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'short');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/validation failed|invalid/i')).toBeVisible();
  });

  test('should have OAuth provider buttons', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible();
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
  });

  test('should display auth error page', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    await expect(page.locator('text=Authentication Error')).toBeVisible();
    await expect(page.locator('text=/permission/i')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should redirect to login when accessing admin route', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
