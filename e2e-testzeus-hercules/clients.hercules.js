const { test, expect } = require('@testzeus/hercules');

test.describe('Client Management Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login and navigate to clients
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@gcmc-kaj.com');
        await page.fill('[name="password"]', 'AdminPassword123');
        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.goto('/clients');
        await page.waitForLoadState('networkidle');
    });

    test('Clients page loads with client list', async ({ page }) => {
        await expect(page.locator('h1:has-text("Clients")')).toBeVisible();
        await expect(page.locator('[data-testid="clients-table"]')).toBeVisible();

        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/clients-page.png' });
    });

    test('Add new client form works', async ({ page }) => {
        await page.click('[data-testid="add-client-button"]');

        await page.fill('[name="companyName"]', 'Test Company Ltd.');
        await page.fill('[name="contactEmail"]', 'test@company.com');
        await page.fill('[name="contactPhone"]', '+592-123-4567');

        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/add-client-form.png' });

        await page.click('[type="submit"]');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('text=Test Company Ltd.')).toBeVisible();
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/client-added.png' });
    });

    test('Client details view works', async ({ page }) => {
        await page.click('[data-testid="client-row"]:first-child');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="client-details"]')).toBeVisible();
        await page.screenshot({ path: 'test-results/testzeus-hercules/screenshots/client-details.png' });
    });
});
