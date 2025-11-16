import { expect, test } from "../../fixtures/base-fixtures";

/**
 * Navigation Tests - Routes
 *
 * Tests route discovery, navigation, and page loading.
 */
test.describe("Route Discovery", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	const protectedRoutes = [
		{ path: "/dashboard", title: /Dashboard/i },
		{ path: "/dashboard/services", title: /Services/i },
		{ path: "/dashboard/clients", title: /Clients/i },
		{ path: "/dashboard/service-requests", title: /Service Requests/i },
		{ path: "/dashboard/documents", title: /Documents/i },
		{ path: "/dashboard/filings", title: /Filings/i },
		{ path: "/dashboard/conversations", title: /Conversations/i },
		{ path: "/dashboard/tasks", title: /Tasks/i },
		{ path: "/dashboard/notifications", title: /Notifications/i },
		{ path: "/dashboard/analytics", title: /Analytics/i },
		{ path: "/dashboard/admin", title: /Admin/i },
	];

	for (const route of protectedRoutes) {
		test(`should load ${route.path}`, async ({ page }) => {
			await page.goto(route.path);

			// Verify page loaded
			await expect(page).toHaveURL(new RegExp(route.path));

			// Verify page title or heading
			const pageHeading = page.locator("h1").first();
			await expect(pageHeading).toBeVisible();
		});

		test(`should not have console errors on ${route.path}`, async ({
			page,
		}) => {
			const consoleErrors: string[] = [];

			page.on("console", (msg) => {
				if (msg.type() === "error") {
					consoleErrors.push(msg.text());
				}
			});

			await page.goto(route.path);
			await page.waitForLoadState("networkidle");

			// Filter out known acceptable errors (like third-party scripts)
			const criticalErrors = consoleErrors.filter(
				(error) =>
					!error.includes("third-party") && !error.includes("extension"),
			);

			expect(criticalErrors, `No console errors on ${route.path}`).toHaveLength(
				0,
			);
		});
	}
});

test.describe("Navigation Flow", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("should navigate between dashboard pages", async ({ page }) => {
		await page.goto("/dashboard");

		// Navigate to services
		await page.click('a[href*="/services"]');
		await expect(page).toHaveURL(/\/services/);

		// Navigate to clients
		await page.click('a[href*="/clients"]');
		await expect(page).toHaveURL(/\/clients/);

		// Navigate back to dashboard
		await page.click('a[href="/dashboard"]');
		await expect(page).toHaveURL(/\/dashboard$/);
	});

	test("should handle browser back/forward", async ({ page }) => {
		await page.goto("/dashboard");
		await page.goto("/dashboard/services");
		await page.goto("/dashboard/clients");

		// Go back
		await page.goBack();
		await expect(page).toHaveURL(/\/services/);

		// Go back again
		await page.goBack();
		await expect(page).toHaveURL(/\/dashboard$/);

		// Go forward
		await page.goForward();
		await expect(page).toHaveURL(/\/services/);
	});

	test("should display 404 for invalid routes", async ({ page }) => {
		const response = await page.goto("/invalid-route-that-does-not-exist");

		// Check for 404 status or 404 page content
		if (response) {
			expect(response.status()).toBe(404);
		} else {
			// If no response, check for 404 content on page
			await expect(
				page.locator("text=/404|not found|page (not|doesn't) exist/i"),
			).toBeVisible();
		}
	});
});

test.describe("Protected Routes", () => {
	test("should redirect to login when not authenticated", async ({ page }) => {
		// Try to access protected route
		await page.goto("/dashboard");

		// Should be redirected to login
		await expect(page).toHaveURL(/\/login/);
	});

	test("should allow access when authenticated", async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage;

		// Access protected route
		await page.goto("/dashboard");

		// Should stay on dashboard
		await expect(page).toHaveURL(/\/dashboard/);
	});
});

test.describe("Page Load Performance", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("should load dashboard within acceptable time", async ({ page }) => {
		const startTime = Date.now();

		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");

		const loadTime = Date.now() - startTime;

		// Dashboard should load within 5 seconds
		expect(loadTime).toBeLessThan(5000);
	});

	test("should measure Time to Interactive", async ({ page }) => {
		await page.goto("/dashboard");

		// Wait for page to be interactive
		await page.waitForLoadState("domcontentloaded");

		// Measure time to interactive using Performance API
		const tti = await page.evaluate(() => {
			return new Promise<number>((resolve) => {
				if (document.readyState === "complete") {
					resolve(performance.now());
				} else {
					window.addEventListener("load", () => {
						resolve(performance.now());
					});
				}
			});
		});

		// TTI should be under 3 seconds
		expect(tti).toBeLessThan(3000);
	});
});
