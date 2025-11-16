import { expect, test } from "../../fixtures/base-fixtures";

/**
 * Accessibility Tests - WCAG Compliance
 *
 * Tests for WCAG 2.1 Level AA compliance across all pages.
 */
test.describe("WCAG AA Compliance", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	const pages = [
		{ path: "/dashboard", name: "Dashboard Home" },
		{ path: "/dashboard/services", name: "Services List" },
		{ path: "/dashboard/services/new", name: "New Service Form" },
		{ path: "/dashboard/clients", name: "Clients List" },
		{ path: "/dashboard/clients/new", name: "New Client Form" },
		{ path: "/dashboard/service-requests", name: "Service Requests" },
		{ path: "/dashboard/documents", name: "Documents" },
		{ path: "/dashboard/filings", name: "Filings" },
		{ path: "/dashboard/tasks", name: "Tasks" },
		{ path: "/dashboard/notifications", name: "Notifications" },
		{ path: "/dashboard/analytics", name: "Analytics" },
	];

	for (const pageInfo of pages) {
		test(`${pageInfo.name} should meet WCAG AA standards`, async ({
			page,
			a11yHelper,
		}) => {
			await page.goto(pageInfo.path);
			await page.waitForLoadState("networkidle");

			// Run WCAG AA compliance scan
			await a11yHelper.scanWCAG_AA();
		});
	}
});

test.describe("Keyboard Navigation", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("should navigate dashboard with keyboard only", async ({
		page,
		a11yHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Tab through interactive elements
		const interactiveElements = [
			'a[href="/dashboard/services"]',
			'a[href="/dashboard/clients"]',
			'a[href="/dashboard/service-requests"]',
		];

		await a11yHelper.testKeyboardNavigation(interactiveElements);
	});

	test("forms should be keyboard accessible", async ({ page }) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Tab through form
		await page.keyboard.press("Tab");
		await expect(page.locator('input[name="name"]')).toBeFocused();

		await page.keyboard.press("Tab");
		await expect(page.locator('textarea[name="description"]')).toBeFocused();

		// Fill form with keyboard
		await page.keyboard.type("Test Service");
		await page.keyboard.press("Tab");
		await page.keyboard.type("Test description");
	});

	test("buttons should have focus indicators", async ({ page, a11yHelper }) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Test focus visible on submit button
		await a11yHelper.testFocusVisible('button[type="submit"]');
	});
});

test.describe("Screen Reader Support", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("headings should have proper hierarchy", async ({
		page,
		a11yHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Test semantic HTML
		await a11yHelper.testSemanticHTML();

		// Check heading levels
		const h1 = await page.locator("h1").count();
		expect(h1).toBeGreaterThan(0);

		// There should be exactly one h1
		expect(h1).toBe(1);
	});

	test("images should have alt text", async ({ page, a11yHelper }) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Test all images have alt text
		await a11yHelper.testImageAltText();
	});

	test("forms should have proper labels", async ({ page, a11yHelper }) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Test form labels
		await a11yHelper.testFormLabels();
	});

	test("interactive elements should have ARIA labels", async ({
		page,
		a11yHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Test specific elements that need ARIA labels
		const menuButton = page.locator('[data-testid="user-menu"]');
		if ((await menuButton.count()) > 0) {
			await a11yHelper.testAriaLabels('[data-testid="user-menu"]');
		}
	});

	test("landmarks should be properly defined", async ({ page }) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Check for ARIA landmarks
		await expect(page.locator("main")).toBeVisible();
		await expect(page.locator("nav")).toBeVisible();

		// Header and footer if present
		const header = page.locator("header");
		if ((await header.count()) > 0) {
			await expect(header).toBeVisible();
		}
	});
});

test.describe("Color Contrast", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("should meet color contrast requirements", async ({
		page,
		a11yHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Test color contrast
		await a11yHelper.testColorContrast();
	});

	test("dark mode should meet contrast requirements", async ({
		page,
		a11yHelper,
	}) => {
		// Enable dark mode
		await page.emulateMedia({ colorScheme: "dark" });

		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Test color contrast in dark mode
		await a11yHelper.testColorContrast();
	});
});

test.describe("Dynamic Content", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("notifications should announce to screen readers", async ({
		page,
		a11yHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Find notification/toast container
		const notificationContainer = page
			.locator('[role="status"]')
			.or(page.locator('[aria-live="polite"]'));

		if ((await notificationContainer.count()) > 0) {
			// Test ARIA live region
			await a11yHelper.testAriaLive('[role="status"]', "polite");
		}
	});

	test("loading states should be announced", async ({ page }) => {
		await page.goto("/dashboard/services");

		// Check for loading indicators with proper ARIA
		const loadingIndicator = page
			.locator('[aria-busy="true"]')
			.or(page.locator('[role="progressbar"]'));

		// If loading state exists, it should have proper ARIA
		if ((await loadingIndicator.count()) > 0) {
			const ariaLabel = await loadingIndicator.getAttribute("aria-label");
			expect(ariaLabel).toBeTruthy();
		}
	});
});

test.describe("Accessibility Reports", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("generate accessibility report for dashboard", async ({
		page,
		a11yHelper,
	}) => {
		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		// Generate detailed accessibility report
		await a11yHelper.generateReport("dashboard-a11y-report");
	});

	test("generate accessibility report for forms", async ({
		page,
		a11yHelper,
	}) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Generate detailed accessibility report
		await a11yHelper.generateReport("service-form-a11y-report");
	});
});
