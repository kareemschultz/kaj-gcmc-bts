const { test, expect } = require('@testzeus/hercules');

test.describe('Authentication Flow Tests', () => {
    test('User can login successfully', async ({ page }) => {
        await page.goto('/login');

        // Take screenshot of login page
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/login-page.png' });

        // Fill login form
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');

        // Take screenshot before submission
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/login-form-filled.png' });

        // Submit form
        await page.click('[type="submit"]');

        // Wait for navigation
        await page.waitForLoadState('networkidle');

        // Take screenshot after login
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/post-login.png' });

        // Verify successful login
        await expect(page).toHaveURL(/dashboard/);
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('Invalid credentials show error', async ({ page }) => {
        await page.goto('/login');

        await page.fill('[name="email"]', 'invalid@example.com');
        await page.fill('[name="password"]', 'wrongpassword');
        await page.click('[type="submit"]');

        // Verify error message
        await expect(page.locator('text=Invalid credentials')).toBeVisible();
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/login-error.png' });
    });

    test('User can logout', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');
        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');

        // Logout
        await page.click('[data-testid="user-menu"]');
        await page.click('text=Logout');

        // Verify logout
        await expect(page).toHaveURL(/login/);
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/logout-success.png' });
    });
});
