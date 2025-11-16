import { expect, test } from "../../fixtures/base-fixtures";

/**
 * CRUD Tests - Services
 *
 * Tests Create, Read, Update, Delete operations for services.
 */
test.describe("Services CRUD", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test.beforeEach(async ({ page }) => {
		// Navigate to services page before each test
		await page.goto("/dashboard/services");
		await page.waitForLoadState("networkidle");
	});

	test("should display services list", async ({ page }) => {
		// Verify page loaded
		await expect(page).toHaveURL(/\/services/);

		// Check for services table or list
		const servicesList = page
			.locator('[data-testid="services-list"]')
			.or(page.locator("table"));
		await expect(servicesList).toBeVisible();
	});

	test("should create a new service", async ({ page }) => {
		// Click create button
		await page.click('a[href*="/services/new"]');
		await expect(page).toHaveURL(/\/services\/new/);

		// Fill in service form
		await page.fill('input[name="name"]', "Test E2E Service");
		await page.fill(
			'textarea[name="description"]',
			"This is a test service created by E2E tests",
		);

		// Select category
		const categorySelect = page.locator('select[name="category"]');
		if ((await categorySelect.count()) > 0) {
			await categorySelect.selectOption("COMPLIANCE");
		}

		// Fill in price
		await page.fill('input[name="basePrice"]', "250");

		// Submit form
		await page.click('button[type="submit"]');

		// Verify redirect to services list or detail page
		await page.waitForURL(/\/services/);

		// Verify service was created
		await expect(page.locator('text="Test E2E Service"')).toBeVisible();
	});

	test("should view service details", async ({ page, dataSeeder }) => {
		// Create a test service
		const tenant = await dataSeeder.createTenant();
		const service = await dataSeeder.createService(tenant.id, {
			name: "View Test Service",
		});

		// Navigate to service detail page
		await page.goto(`/dashboard/services/${service.id}`);

		// Verify service details are displayed
		await expect(page.locator("h1")).toContainText("View Test Service");
		await expect(page.locator("text=/compliance/i")).toBeVisible();
	});

	test("should update service", async ({ page, dataSeeder }) => {
		// Create a test service
		const tenant = await dataSeeder.createTenant();
		const service = await dataSeeder.createService(tenant.id, {
			name: "Update Test Service",
		});

		// Navigate to service detail page
		await page.goto(`/dashboard/services/${service.id}`);

		// Click edit button
		await page.click('button:has-text("Edit")');

		// Update service name
		await page.fill('input[name="name"]', "Updated Service Name");

		// Submit form
		await page.click('button[type="submit"]');

		// Verify update
		await expect(page.locator("text=Updated Service Name")).toBeVisible();
	});

	test("should delete service", async ({ page, dataSeeder }) => {
		// Create a test service
		const tenant = await dataSeeder.createTenant();
		const service = await dataSeeder.createService(tenant.id, {
			name: "Delete Test Service",
		});

		// Navigate to services list
		await page.goto("/dashboard/services");

		// Find and click delete button for this service
		const serviceRow = page.locator(`tr:has-text("Delete Test Service")`);
		await serviceRow.locator('button:has-text("Delete")').click();

		// Confirm deletion
		await page.click('button:has-text("Confirm")');

		// Verify service is removed
		await expect(page.locator('text="Delete Test Service"')).not.toBeVisible();
	});

	test("should validate required fields", async ({ page }) => {
		// Navigate to create service page
		await page.goto("/dashboard/services/new");

		// Try to submit empty form
		await page.click('button[type="submit"]');

		// Verify validation errors
		await expect(
			page.locator("text=/name.*required/i").or(page.locator(".error")),
		).toBeVisible();
	});

	test("should filter services", async ({ page }) => {
		await page.goto("/dashboard/services");

		// Look for filter/search input
		const searchInput = page.locator('input[placeholder*="Search"]');

		if ((await searchInput.count()) > 0) {
			// Type in search
			await searchInput.fill("Compliance");

			// Wait for results to filter
			await page.waitForTimeout(500);

			// Verify filtered results
			const results = page.locator('[data-testid="service-item"]');
			const count = await results.count();

			if (count > 0) {
				// At least one result should contain "Compliance"
				await expect(results.first()).toContainText(/Compliance/i);
			}
		}
	});

	test("should paginate services", async ({ page }) => {
		await page.goto("/dashboard/services");

		// Look for pagination controls
		const nextButton = page.locator('button:has-text("Next")');

		if ((await nextButton.count()) > 0 && (await nextButton.isEnabled())) {
			// Get current page services
			const firstPageServices = await page
				.locator('[data-testid="service-item"]')
				.count();

			// Click next page
			await nextButton.click();
			await page.waitForLoadState("networkidle");

			// Verify page changed (different services or URL changed)
			const secondPageServices = await page
				.locator('[data-testid="service-item"]')
				.count();

			// Either count is different or URL has pagination param
			const urlHasPagination = page.url().includes("page=");
			expect(
				firstPageServices !== secondPageServices || urlHasPagination,
			).toBeTruthy();
		}
	});
});

test.describe("Services - Accessibility", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("services list should be accessible", async ({ page, a11yHelper }) => {
		await page.goto("/dashboard/services");
		await page.waitForLoadState("networkidle");

		// Run accessibility scan
		await a11yHelper.scanWCAG_AA();
	});

	test("service form should be accessible", async ({ page, a11yHelper }) => {
		await page.goto("/dashboard/services/new");
		await page.waitForLoadState("networkidle");

		// Run accessibility scan
		await a11yHelper.scanWCAG_AA();
	});
});
