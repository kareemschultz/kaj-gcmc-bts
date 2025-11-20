import path from "node:path";
import type { Page } from "@playwright/test";
import { test as base, expect } from "@playwright/test";

// Import existing helpers
import { AccessibilityHelper } from "../../utils/accessibility-helper";
import { AuthHelper } from "../../utils/auth-helper";
import { DataSeeder } from "../../utils/data-seeder";
import { ScreenshotHelper } from "../../utils/screenshot-helper";
// Import API helper
import { ApiHelper } from "../api/api-helper";
import { NavigationComponent } from "../page-objects/components/navigation-component";
import { ClientsPage } from "../page-objects/pages/clients-page";
import { DashboardPage } from "../page-objects/pages/dashboard-page";
// Import new page objects
import { LoginPage } from "../page-objects/pages/login-page";

/**
 * Enhanced Test Fixtures for GCMC Platform E2E Tests
 *
 * Extends the base fixtures with page objects and enhanced functionality.
 * Provides reusable components for all test scenarios.
 */

type EnhancedFixtures = {
	// Existing helpers
	authHelper: AuthHelper;
	dataSeeder: DataSeeder;
	screenshotHelper: ScreenshotHelper;
	a11yHelper: AccessibilityHelper;

	// Page Objects
	loginPage: LoginPage;
	dashboardPage: DashboardPage;
	clientsPage: ClientsPage;

	// Component Objects
	navigation: NavigationComponent;

	// API Helper
	apiHelper: ApiHelper;

	// Enhanced Page Contexts
	authenticatedPage: Page;
	adminPage: Page;
	mobilePage: Page;
	tabletPage: Page;

	// Test Data Context
	testTenant: {
		id: string;
		name: string;
		slug: string;
	};

	// Performance tracking
	performanceMetrics: {
		startTime: number;
		endTime?: number;
		loadTime?: number;
		metrics: any[];
	};
};

/**
 * Enhanced test object with all fixtures
 */
export const test = base.extend<EnhancedFixtures>({
	// Existing helpers
	authHelper: async ({ page }, use) => {
		const authHelper = new AuthHelper(page);
		await use(authHelper);
	},

	dataSeeder: async ({ page }, use) => {
		const seeder = new DataSeeder();
		await use(seeder);
		await seeder.cleanup();
	},

	screenshotHelper: async ({ page }, use) => {
		const helper = new ScreenshotHelper(page);
		await use(helper);
	},

	a11yHelper: async ({ page }, use) => {
		const helper = new AccessibilityHelper(page);
		await use(helper);
	},

	// Page Objects
	loginPage: async ({ page }, use) => {
		const loginPage = new LoginPage(page);
		await use(loginPage);
	},

	dashboardPage: async ({ page }, use) => {
		const dashboardPage = new DashboardPage(page);
		await use(dashboardPage);
	},

	clientsPage: async ({ page }, use) => {
		const clientsPage = new ClientsPage(page);
		await use(clientsPage);
	},

	// Component Objects
	navigation: async ({ page }, use) => {
		const navigation = new NavigationComponent(page);
		await use(navigation);
	},

	// API Helper
	apiHelper: async ({}, use) => {
		const apiHelper = new ApiHelper();
		await apiHelper.initializeContext();
		await use(apiHelper);
		await apiHelper.cleanup();
	},

	// Enhanced authenticated page fixture
	authenticatedPage: async ({ browser }, use) => {
		const authStatePath = path.resolve(__dirname, "auth-state.json");
		let context;

		try {
			context = await browser.newContext({
				storageState: authStatePath,
			});
		} catch (error) {
			// If auth state doesn't exist, create a new context and login
			context = await browser.newContext();
			const page = await context.newPage();
			const authHelper = new AuthHelper(page);
			await authHelper.loginAsTestUser();

			// Save auth state for future tests
			await context.storageState({ path: authStatePath });
		}

		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	// Admin page fixture with enhanced capabilities
	adminPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			// Enable additional permissions for admin
			permissions: ["clipboard-read", "clipboard-write"],
		});

		const page = await context.newPage();
		const authHelper = new AuthHelper(page);
		await authHelper.loginAsAdmin();

		await use(page);
		await context.close();
	},

	// Mobile page fixture
	mobilePage: async ({ browser }, use) => {
		const context = await browser.newContext({
			viewport: { width: 375, height: 667 },
			userAgent:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
			deviceScaleFactor: 2,
			isMobile: true,
			hasTouch: true,
		});

		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	// Tablet page fixture
	tabletPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			viewport: { width: 1024, height: 768 },
			userAgent:
				"Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
			deviceScaleFactor: 2,
			isMobile: false,
			hasTouch: true,
		});

		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	// Test tenant fixture
	testTenant: async ({}, use) => {
		await use({
			id: "test-tenant-id",
			name: "Test Tenant Organization",
			slug: "test-tenant",
		});
	},

	// Performance tracking fixture
	performanceMetrics: async ({ page }, use) => {
		const metrics = {
			startTime: Date.now(),
			metrics: [] as any[],
		};

		// Collect performance metrics
		page.on("response", (response) => {
			metrics.metrics.push({
				url: response.url(),
				status: response.status(),
				timing: response.timing(),
				timestamp: Date.now(),
			});
		});

		await use(metrics);

		// Calculate final metrics
		metrics.endTime = Date.now();
		metrics.loadTime = metrics.endTime - metrics.startTime;
	},
});

// Re-export expect for convenience
export { expect };

/**
 * Enhanced helper functions
 */

/**
 * Wait for page to be fully loaded with performance tracking
 */
export async function waitForPageReady(page: Page): Promise<void> {
	await page.waitForLoadState("networkidle");
	await page.waitForLoadState("domcontentloaded");

	// Wait for any lazy-loaded content
	await page.waitForTimeout(500);
}

/**
 * Check for console errors with filtering
 */
export async function expectNoConsoleErrors(
	page: Page,
	allowedErrors: string[] = [],
): Promise<void> {
	const errors: string[] = [];

	page.on("console", (msg) => {
		if (msg.type() === "error") {
			const errorText = msg.text();
			const isAllowedError = allowedErrors.some((allowed) =>
				errorText.includes(allowed),
			);

			if (!isAllowedError) {
				errors.push(errorText);
			}
		}
	});

	// Return a function to assert no errors
	return () => {
		expect(
			errors,
			`Console should not have any errors. Found: ${errors.join(", ")}`,
		).toHaveLength(0);
	};
}

/**
 * Enhanced screenshot function with metadata
 */
export async function takeEnhancedScreenshot(
	page: Page,
	name: string,
	options?: {
		fullPage?: boolean;
		clip?: { x: number; y: number; width: number; height: number };
		annotations?: Array<{
			type: "highlight" | "text";
			x: number;
			y: number;
			text?: string;
		}>;
	},
): Promise<void> {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const fileName = `${name}-${timestamp}.png`;

	await page.screenshot({
		path: `test-results/screenshots/${fileName}`,
		fullPage: options?.fullPage ?? true,
		clip: options?.clip,
	});

	// Log screenshot info for Allure
	console.log(`Screenshot taken: ${fileName}`);
}

/**
 * Test data generator utilities
 */
export class TestDataGenerator {
	static generateEmail(prefix = "test"): string {
		return `${prefix}.${Date.now()}@example.com`;
	}

	static generatePhoneNumber(): string {
		return `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
	}

	static generateTaxId(): string {
		return `TAX-${Math.floor(Math.random() * 90000 + 10000)}`;
	}

	static generateCompanyName(): string {
		const companies = [
			"Tech Corp",
			"Business Solutions",
			"Consulting Group",
			"Services Inc",
			"Global Ltd",
		];
		const suffixes = ["LLC", "Inc", "Corp", "Ltd", "Group"];
		return `${companies[Math.floor(Math.random() * companies.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
	}

	static generateAddress(): string {
		const streetNumbers = Math.floor(Math.random() * 9999 + 1);
		const streets = ["Main St", "Oak Ave", "Pine Rd", "Cedar Blvd", "Elm Dr"];
		const cities = [
			"Springfield",
			"Franklin",
			"Georgetown",
			"Madison",
			"Clinton",
		];
		const states = ["NY", "CA", "TX", "FL", "IL"];

		return `${streetNumbers} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}, ${states[Math.floor(Math.random() * states.length)]} ${Math.floor(Math.random() * 90000 + 10000)}`;
	}
}

/**
 * Enhanced retry utility
 */
export async function retryAsync<T>(
	operation: () => Promise<T>,
	retries = 3,
	delay = 1000,
): Promise<T> {
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			if (attempt === retries) {
				throw error;
			}

			console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw new Error("This should never be reached");
}

/**
 * Test environment checker
 */
export class EnvironmentChecker {
	static isDevelopment(): boolean {
		return process.env.NODE_ENV === "development";
	}

	static isCi(): boolean {
		return !!process.env.CI;
	}

	static getBaseUrl(): string {
		return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
	}

	static getApiUrl(): string {
		return process.env.API_URL || "http://localhost:3003";
	}
}
