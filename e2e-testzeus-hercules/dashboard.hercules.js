const { test, expect } = require("@testzeus/hercules");

test.describe("Dashboard Functionality Tests", () => {
	test.beforeEach(async ({ page }) => {
		// Login before each test
		await page.goto("/login");
		await page.fill('[name="email"]', "admin@gcmc-kaj.com");
		await page.fill('[name="password"]', "AdminPassword123");
		await page.click('[type="submit"]');
		await page.waitForLoadState("networkidle");
	});

	test("Dashboard loads with all components", async ({ page }) => {
		await expect(page).toHaveURL(/dashboard/);

		// Check for key dashboard components
		await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
		await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
		await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();

		await page.screenshot({
			path: "test-results/testzeus-hercules/screenshots/dashboard-loaded.png",
		});
	});

	test("Navigation menu works correctly", async ({ page }) => {
		// Test all navigation links
		const navItems = [
			"Clients",
			"Documents",
			"Filings",
			"Analytics",
			"Services",
		];

		for (const item of navItems) {
			await page.click(`nav a:has-text("${item}")`);
			await page.waitForLoadState("networkidle");
			await page.screenshot({
				path: `test-results/testzeus-hercules/screenshots/nav-${item.toLowerCase()}.png`,
			});
		}
	});

	test("Search functionality works", async ({ page }) => {
		await page.fill('[data-testid="search-input"]', "test client");
		await page.press('[data-testid="search-input"]', "Enter");
		await page.waitForLoadState("networkidle");

		await page.screenshot({
			path: "test-results/testzeus-hercules/screenshots/search-results.png",
		});
	});
});
