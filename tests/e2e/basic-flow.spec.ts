import { test, expect } from '@playwright/test';

/**
 * Basic Flow Tests
 * Simple tests to verify frontend and backend connectivity
 */

test.describe('Basic Frontend & Backend Tests', () => {
  test('should load homepage and navigate to login', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3001');

    // Verify page loads
    await expect(page).toHaveTitle(/GCMC.*KAJ/i);

    // Navigate to login page
    await page.goto('http://localhost:3001/login');

    // Verify login page loads and has form
    await expect(page).toHaveTitle(/Sign In/i);

    // Look for form elements (more flexible selectors)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], input[type="submit"]')).toBeVisible();

    console.log('✅ Login page successfully loaded with all form elements');
  });

  test('should connect to backend API', async ({ request }) => {
    // Test backend health endpoint
    const healthResponse = await request.get('http://localhost:3003/health');
    expect(healthResponse.status()).toBe(200);

    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('ok');

    console.log('✅ Backend API health check passed');
  });

  test('should have responsive login page on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3001/login');

    // Verify mobile layout
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    console.log('✅ Mobile login page layout verified');
  });
});