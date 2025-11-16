import { expect, test } from "../../fixtures/base-fixtures";

/**
 * Visual Regression Tests - Dashboard
 *
 * Tests for visual consistency across browser updates and code changes.
 */
test.describe("Dashboard Visual Regression", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("dashboard page should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Mask dynamic elements (dates, times, etc.)
		const dynamicElements = await screenshotHelper.maskDynamicElements([
			'[data-testid="current-time"]',
			'[data-testid="last-updated"]',
			".timestamp",
		]);

		// Wait for all images to load
		await screenshotHelper.waitForImages();

		// Compare with baseline
		await screenshotHelper.compareFullPage("dashboard-home", {
			mask: dynamicElements,
		});
	});

	test("services list should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard/services");
		await page.waitForLoadState("networkidle");

		// Wait for content to load
		await page.waitForSelector('[data-testid="services-list"]', {
			state: "visible",
			timeout: 5000,
		});

		// Compare with baseline
		await screenshotHelper.compareViewport("services-list");
	});

	test("client list should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard/clients");
		await page.waitForLoadState("networkidle");

		// Compare with baseline
		await screenshotHelper.compareViewport("clients-list");
	});

	test("service form should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Compare with baseline
		await screenshotHelper.compareViewport("service-form");
	});

	test("navigation menu should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Take screenshot of just the navigation
		await screenshotHelper.compareElement(
			'[data-testid="sidebar-nav"]',
			"sidebar-navigation",
		);
	});
});

test.describe("Dashboard Visual - Dark Mode", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("dashboard should render correctly in dark mode", async ({
		page,
		screenshotHelper,
	}) => {
		// Set dark mode preference
		await page.emulateMedia({ colorScheme: "dark" });

		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Wait for images
		await screenshotHelper.waitForImages();

		// Compare with baseline
		await screenshotHelper.compareFullPage("dashboard-dark-mode");
	});
});

test.describe("Dashboard Visual - Different Viewports", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("dashboard at 1920x1080", async ({ page, screenshotHelper }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		await screenshotHelper.compareViewport("dashboard-1920x1080");
	});

	test("dashboard at 1366x768", async ({ page, screenshotHelper }) => {
		await page.setViewportSize({ width: 1366, height: 768 });
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		await screenshotHelper.compareViewport("dashboard-1366x768");
	});

	test("dashboard at tablet size", async ({ page, screenshotHelper }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		await screenshotHelper.compareViewport("dashboard-tablet");
	});
});

test.describe("Component Visual Regression", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("buttons should match baseline", async ({ page, screenshotHelper }) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Capture primary button
		await screenshotHelper.compareElement(
			'button[type="submit"]',
			"button-primary",
		);
	});

	test("form inputs should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Capture input field
		await screenshotHelper.compareElement('input[name="name"]', "input-text");
	});

	test("cards should match baseline", async ({
		page,
		screenshotHelper: _screenshotHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Find and capture first card
		const card = page.locator('[data-testid="dashboard-card"]').first();
		if ((await card.count()) > 0) {
			await expect(card).toHaveScreenshot("dashboard-card.png");
		}
	});
});
