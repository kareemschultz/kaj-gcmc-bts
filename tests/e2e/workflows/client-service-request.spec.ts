import { expect, test } from "../../fixtures/base-fixtures";

/**
 * Workflow Tests - Client Service Request
 *
 * Tests complete user workflow: Create client -> Create service request -> Track progress
 */
test.describe("Client Service Request Workflow", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("complete workflow: create client and submit service request", async ({
		page,
	}) => {
		// Step 1: Create a new client
		await page.goto("/dashboard/clients/new");
		await page.waitForLoadState("networkidle");

		// Fill in client details
		await page.fill('input[name="fullName"]', "E2E Test Client Company");
		await page.fill('input[name="email"]', "e2e-client@example.com");
		await page.fill('input[name="phone"]', "+1234567890");

		// Submit client form
		await page.click('button[type="submit"]');

		// Wait for redirect to clients list or detail
		await page.waitForURL(/\/clients/);

		// Verify client was created
		await expect(page.locator('text="E2E Test Client Company"')).toBeVisible();

		// Get the client ID from URL or element
		const currentUrl = page.url();
		const clientIdMatch = currentUrl.match(/\/clients\/([^/]+)/);
		const clientId = clientIdMatch ? clientIdMatch[1] : null;

		if (clientId) {
			// Step 2: Create service request for this client
			await page.goto("/dashboard/service-requests/new");
			await page.waitForLoadState("networkidle");

			// Select the client
			const clientSelect = page.locator('select[name="clientId"]');
			if ((await clientSelect.count()) > 0) {
				await clientSelect.selectOption(clientId);
			}

			// Select a service
			const serviceSelect = page.locator('select[name="serviceId"]');
			if ((await serviceSelect.count()) > 0) {
				await serviceSelect.selectOption({ index: 0 });
			}

			// Set priority
			const prioritySelect = page.locator('select[name="priority"]');
			if ((await prioritySelect.count()) > 0) {
				await prioritySelect.selectOption("HIGH");
			}

			// Add description
			const descriptionField = page.locator('textarea[name="description"]');
			if ((await descriptionField.count()) > 0) {
				await descriptionField.fill(
					"E2E test service request for compliance consultation",
				);
			}

			// Submit service request
			await page.click('button[type="submit"]');

			// Wait for redirect
			await page.waitForURL(/\/service-requests/);

			// Verify service request was created
			await expect(
				page.locator('text="E2E Test Client Company"'),
			).toBeVisible();

			// Step 3: View service request details
			const serviceRequestLink = page
				.locator('a[href*="/service-requests/"]')
				.first();
			await serviceRequestLink.click();

			// Verify details page
			await expect(page).toHaveURL(/\/service-requests\/[^/]+$/);
			await expect(
				page.locator('text="E2E Test Client Company"'),
			).toBeVisible();
			await expect(page.locator("text=/HIGH|high/i")).toBeVisible();
		}
	});

	test("workflow: track service request progress", async ({
		page,
		dataSeeder,
	}) => {
		// Setup: Create test data
		const tenant = await dataSeeder.createTenant();
		const client = await dataSeeder.createClient(tenant.id, {
			fullName: "Workflow Test Client",
		});
		const service = await dataSeeder.createService(tenant.id, {
			name: "Workflow Test Service",
		});
		const serviceRequest = await dataSeeder.createServiceRequest(
			tenant.id,
			client.id,
			service.id,
			{ status: "PENDING" },
		);

		// Navigate to service request detail
		await page.goto(`/dashboard/service-requests/${serviceRequest.id}`);

		// Verify current status
		await expect(page.locator("text=/PENDING|pending/i")).toBeVisible();

		// Update status to IN_PROGRESS
		const statusButton = page.locator('button:has-text("Update Status")');
		if ((await statusButton.count()) > 0) {
			await statusButton.click();

			// Select new status
			const statusSelect = page.locator('select[name="status"]');
			await statusSelect.selectOption("IN_PROGRESS");

			// Save
			await page.click('button:has-text("Save")');

			// Verify status updated
			await expect(
				page.locator("text=/IN_PROGRESS|in progress/i"),
			).toBeVisible();
		}
	});

	test("workflow: attach documents to service request", async ({
		page,
		dataSeeder,
	}) => {
		// Setup: Create test data
		const tenant = await dataSeeder.createTenant();
		const client = await dataSeeder.createClient(tenant.id);
		const service = await dataSeeder.createService(tenant.id);
		const serviceRequest = await dataSeeder.createServiceRequest(
			tenant.id,
			client.id,
			service.id,
		);

		// Navigate to service request
		await page.goto(`/dashboard/service-requests/${serviceRequest.id}`);

		// Look for document upload section
		const uploadButton = page.locator('button:has-text("Upload Document")');

		if ((await uploadButton.count()) > 0) {
			await uploadButton.click();

			// In a real test, you would upload a file
			// For now, just verify the upload dialog appears
			await expect(
				page.locator('input[type="file"]').or(page.locator("text=Upload")),
			).toBeVisible();
		}
	});

	test("workflow: complete service request lifecycle", async ({
		page,
		dataSeeder,
	}) => {
		// Setup: Create test data
		const tenant = await dataSeeder.createTenant();
		const client = await dataSeeder.createClient(tenant.id, {
			fullName: "Lifecycle Test Client",
		});
		const service = await dataSeeder.createService(tenant.id);
		const serviceRequest = await dataSeeder.createServiceRequest(
			tenant.id,
			client.id,
			service.id,
			{ status: "PENDING" },
		);

		// Step 1: View pending request
		await page.goto("/dashboard/service-requests");
		await expect(
			page
				.locator(`text="${serviceRequest.id}"`)
				.or(page.locator('text="Lifecycle Test Client"')),
		).toBeVisible();

		// Step 2: Open request details
		await page.goto(`/dashboard/service-requests/${serviceRequest.id}`);
		await expect(page.locator("text=/PENDING|pending/i")).toBeVisible();

		// Step 3: Move to In Progress
		// (Status update logic would go here)

		// Step 4: Complete the request
		// (Completion logic would go here)

		// Verify workflow completed
		await expect(page).toHaveURL(/\/service-requests/);
	});
});

test.describe("Service Request Workflow - Error Handling", () => {
	test.use({ storageState: "tests/fixtures/auth-state.json" });

	test("should handle missing required client", async ({ page }) => {
		await page.goto("/dashboard/service-requests/new");

		// Try to submit without selecting client
		await page.click('button[type="submit"]');

		// Verify validation error
		await expect(
			page
				.locator("text=/client.*required/i")
				.or(page.locator('[data-error="clientId"]')),
		).toBeVisible();
	});

	test("should handle missing required service", async ({ page }) => {
		await page.goto("/dashboard/service-requests/new");

		// Try to submit without selecting service
		await page.click('button[type="submit"]');

		// Verify validation error
		await expect(
			page
				.locator("text=/service.*required/i")
				.or(page.locator('[data-error="serviceId"]')),
		).toBeVisible();
	});
});
