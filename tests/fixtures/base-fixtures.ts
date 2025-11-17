import path from "node:path";
import type { Page } from "@playwright/test";
import { test as base, expect } from "@playwright/test";
import { AccessibilityHelper } from "../utils/accessibility-helper";
import { AuthHelper } from "../utils/auth-helper";
import { DataSeeder } from "../utils/data-seeder";
import { ScreenshotHelper } from "../utils/screenshot-helper";

/**
 * Extended Test Fixtures for GCMC Platform E2E Tests
 *
 * This file defines custom fixtures that are available to all tests.
 * Fixtures provide reusable functionality and automatic setup/teardown.
 */

type CustomFixtures = {
	// Authentication helper
	authHelper: AuthHelper;

	// Authenticated page (logged in as test user)
	authenticatedPage: Page;

	// Admin page (logged in as admin user)
	adminPage: Page;

	// Data seeding helper
	dataSeeder: DataSeeder;

	// Screenshot comparison helper
	screenshotHelper: ScreenshotHelper;

	// Accessibility testing helper
	a11yHelper: AccessibilityHelper;

	// Mobile viewport page
	mobilePage: Page;

	// Test tenant context
	testTenant: {
		id: string;
		name: string;
		slug: string;
	};
};

/**
 * Extended test object with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
	// Auth helper fixture
	authHelper: async ({ page }, use) => {
		const authHelper = new AuthHelper(page);
		await use(authHelper);
	},

	// Authenticated page fixture - reuses saved auth state
	authenticatedPage: async ({ browser }, use) => {
		const authStatePath = path.resolve(__dirname, "auth-state.json");
		const context = await browser.newContext({
			storageState: authStatePath,
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	// Admin page fixture - logs in as admin
	adminPage: async ({ browser }, use) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		const authHelper = new AuthHelper(page);
		await authHelper.loginAsAdmin();
		await use(page);
		await context.close();
	},

	// Data seeder fixture
	dataSeeder: async ({ page }, use) => {
		const seeder = new DataSeeder();
		await use(seeder);
		await seeder.cleanup();
	},

	// Screenshot helper fixture
	screenshotHelper: async ({ page }, use) => {
		const helper = new ScreenshotHelper(page);
		await use(helper);
	},

	// Accessibility helper fixture
	a11yHelper: async ({ page }, use) => {
		const helper = new AccessibilityHelper(page);
		await use(helper);
	},

	// Mobile page fixture
	mobilePage: async ({ browser }, use) => {
		const context = await browser.newContext({
			viewport: { width: 375, height: 667 }, // iPhone SE size
			userAgent:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	// Test tenant fixture - provides a consistent test tenant
	testTenant: async ({ page }, use) => {
		await use({
			id: "test-tenant-id",
			name: "Test Tenant",
			slug: "test-tenant",
		});
	},
});

// Re-export expect for convenience
export { expect };

/**
 * Helper to wait for page to be fully loaded
 */
export async function waitForPageReady(page: Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForLoadState("domcontentloaded");
}

/**
 * Helper to check for console errors
 */
export async function expectNoConsoleErrors(page: Page) {
	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") {
			errors.push(msg.text());
		}
	});

	// Return a function to assert no errors
	return () => {
		expect(errors, "Console should not have any errors").toHaveLength(0);
	};
}

/**
 * Helper to take a full-page screenshot
 */
export async function takeFullPageScreenshot(
	page: Page,
	name: string,
): Promise<void> {
	await page.screenshot({
		path: `test-results/screenshots/${name}.png`,
		fullPage: true,
	});
}
