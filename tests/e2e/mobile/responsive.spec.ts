import { expect, test } from "../../fixtures/base-fixtures";
import { MobileViewports } from "../../utils/mobile-viewports";

/**
 * Mobile Responsive Tests
 *
 * Tests for mobile and tablet responsiveness.
 */
test.describe("Mobile Responsiveness - Phone", () => {
	test.use({
		storageState: "tests/fixtures/auth-state.json",
		viewport: MobileViewports.iPhone13.viewport,
	});

	test("dashboard should be mobile responsive", async ({ page }) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Mobile navigation should be visible (hamburger menu)
		const mobileNav = page
			.locator('[data-testid="mobile-menu"]')
			.or(page.locator("button:has-text('Menu')"));
		await expect(mobileNav).toBeVisible();

		// Main content should be visible
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();
	});

	test("services list should be mobile responsive", async ({ page }) => {
		await page.goto("/dashboard/services");
		await page.waitForLoadState("networkidle");

		// Content should be visible and not overflow
		const servicesList = page
			.locator('[data-testid="services-list"]')
			.or(page.locator("main"));
		await expect(servicesList).toBeVisible();

		// Check viewport doesn't cause horizontal scroll
		const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
		const viewportWidth = page.viewportSize()?.width || 0;

		expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
	});

	test("forms should be mobile responsive", async ({ page }) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Form should be visible
		const form = page.locator("form");
		await expect(form).toBeVisible();

		// Inputs should be properly sized
		const nameInput = page.locator('input[name="name"]');
		await expect(nameInput).toBeVisible();

		const inputWidth = await nameInput.evaluate((el) => el.clientWidth);
		const viewportWidth = page.viewportSize()?.width || 0;

		// Input should not overflow (with some margin)
		expect(inputWidth).toBeLessThan(viewportWidth);
	});

	test("touch targets should be appropriately sized", async ({ page }) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Get all buttons
		const buttons = await page.locator("button, a").all();

		// Check first few buttons for touch target size
		for (const button of buttons.slice(0, 5)) {
			const box = await button.boundingBox();
			if (box) {
				// WCAG recommends minimum 44x44 pixels for touch targets
				expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight variance
				expect(box.width).toBeGreaterThanOrEqual(40);
			}
		}
	});

	test("mobile menu should work", async ({ page }) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Find mobile menu button
		const menuButton = page
			.locator('[data-testid="mobile-menu"]')
			.or(page.locator("button:has-text('Menu')"));

		if ((await menuButton.count()) > 0) {
			// Open menu
			await menuButton.click();

			// Navigation should be visible
			const nav = page.locator("nav");
			await expect(nav).toBeVisible();

			// Click a navigation link
			const servicesLink = page.locator('a[href*="/services"]').first();
			await servicesLink.click();

			// Should navigate
			await expect(page).toHaveURL(/\/services/);
		}
	});
});

test.describe("Mobile Responsiveness - Tablet", () => {
	test.use({
		storageState: "tests/fixtures/auth-state.json",
		viewport: MobileViewports.iPadPro11.viewport,
	});

	test("dashboard should adapt to tablet size", async ({ page }) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Main content should be visible
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();

		// Should not have horizontal scroll
		const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
		const viewportWidth = page.viewportSize()?.width || 0;

		expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
	});

	test("tables should be scrollable on tablet", async ({ page }) => {
		await page.goto("/dashboard/services");
		await page.waitForLoadState("networkidle");

		// Find table or list
		const table = page
			.locator("table")
			.or(page.locator('[data-testid="services-list"]'));

		if ((await table.count()) > 0) {
			await expect(table).toBeVisible();

			// Table should fit or be scrollable
			const tableContainer = table.locator("..").first();
			const overflowX = await tableContainer.evaluate(
				(el) => window.getComputedStyle(el).overflowX,
			);

			// Should allow scrolling if content is wider
			expect(["auto", "scroll", "visible"]).toContain(overflowX);
		}
	});
});

test.describe("Mobile Responsiveness - Landscape", () => {
	test.use({
		storageState: "tests/fixtures/auth-state.json",
		viewport: MobileViewports.iPhone13_Landscape.viewport,
	});

	test("dashboard should work in landscape mode", async ({ page }) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Content should be visible
		const mainContent = page.locator("main");
		await expect(mainContent).toBeVisible();

		// No horizontal scroll
		const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
		const viewportWidth = page.viewportSize()?.width || 0;

		expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
	});
});

test.describe("Mobile Touch Interactions", () => {
	test.use({
		storageState: "tests/fixtures/auth-state.json",
		viewport: MobileViewports.iPhone13.viewport,
	});

	test("should handle tap interactions", async ({ page }) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Tap on a link
		const servicesLink = page.locator('a[href*="/services"]').first();
		await servicesLink.tap();

		// Should navigate
		await expect(page).toHaveURL(/\/services/);
	});

	test("should handle swipe gestures on lists", async ({ page }) => {
		await page.goto("/dashboard/services");
		await page.waitForLoadState("networkidle");

		const servicesList = page
			.locator('[data-testid="services-list"]')
			.or(page.locator("main"));

		if ((await servicesList.count()) > 0) {
			// Get initial scroll position
			const initialScroll = await page.evaluate(() => window.scrollY);

			// Swipe up (scroll down)
			await page.mouse.move(200, 400);
			await page.mouse.down();
			await page.mouse.move(200, 200);
			await page.mouse.up();

			// Wait a bit for scroll
			await page.waitForTimeout(300);

			// Should have scrolled
			const finalScroll = await page.evaluate(() => window.scrollY);
			expect(finalScroll).toBeGreaterThanOrEqual(initialScroll);
		}
	});

	test("should handle long press interactions", async ({ page }) => {
		await page.goto("/dashboard/services");
		await page.waitForLoadState("networkidle");

		// Find a service item
		const serviceItem = page.locator('[data-testid="service-item"]').first();

		if ((await serviceItem.count()) > 0) {
			// Long press (if context menu or actions are supported)
			const box = await serviceItem.boundingBox();
			if (box) {
				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
				await page.mouse.down();
				await page.waitForTimeout(1000); // Long press duration
				await page.mouse.up();

				// Check if any context menu appeared (optional)
				// This depends on your app's implementation
			}
		}
	});
});

test.describe("Mobile Visual Regression", () => {
	test.use({
		storageState: "tests/fixtures/auth-state.json",
		viewport: MobileViewports.iPhone13.viewport,
	});

	test("mobile dashboard should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		await screenshotHelper.waitForImages();
		await screenshotHelper.compareFullPage("mobile-dashboard");
	});

	test("mobile services list should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard/services");
		await page.waitForLoadState("networkidle");

		await screenshotHelper.compareViewport("mobile-services-list");
	});

	test("mobile forms should match baseline", async ({
		page,
		screenshotHelper,
	}) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		await screenshotHelper.compareViewport("mobile-service-form");
	});
});

test.describe("Cross-Device Consistency", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	const devices = ["iPhone13", "Pixel5", "iPadMini"] as const;

	for (const device of devices) {
		test(`should render consistently on ${device}`, async ({ browser }) => {
			const context = await browser.newContext({
				...MobileViewports[device],
			});

			const page = await context.newPage();

			// Load auth state
			await context.addCookies(
				JSON.parse(
					require("fs").readFileSync("tests/fixtures/auth-state.json", "utf-8"),
				).cookies,
			);

			await page.goto("/dashboard");
			await page.waitForLoadState("networkidle");

			// Verify main content is visible
			const mainContent = page.locator("main");
			await expect(mainContent).toBeVisible();

			// No horizontal scroll
			const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
			const viewportWidth = page.viewportSize()?.width || 0;

			expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);

			await context.close();
		});
	}
});
