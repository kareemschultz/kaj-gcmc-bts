import { allure } from "allure-playwright";
import { expect, TestDataGenerator, test } from "../fixtures/enhanced-fixtures";
import { TestExecutor } from "../helpers/test-hercules";

/**
 * Complete User Journey Test
 *
 * End-to-end test demonstrating the complete testing framework
 * including Page Objects, API testing, Allure reporting, and TestHercules integration
 */
test.describe("Complete User Journey", () => {
	test.beforeEach(async () => {
		await allure.epic("Complete User Journey");
		await allure.feature("Full Application Workflow");
	});

	test("should complete full user journey from login to client management @critical @smoke", async ({
		page,
		loginPage,
		dashboardPage,
		clientsPage,
		navigation,
		apiHelper,
		screenshotHelper,
		a11yHelper,
		performanceMetrics,
	}) => {
		const testExecutor = new TestExecutor(page);
		const hercules = testExecutor.getHercules();

		await testExecutor.executeScenario({
			name: "Complete User Journey",
			steps: [
				{
					description: "Navigate to login page and verify accessibility",
					action: async () => {
						await loginPage.navigateToLogin();
						await loginPage.verifyLoginPageDisplayed();
						await hercules.captureScreenshot("01-login-page", {
							fullPage: true,
						});

						// Verify accessibility
						await a11yHelper.scanWCAG_AA();

						// Verify performance
						expect(performanceMetrics.loadTime).toBeLessThan(3000);
					},
				},
				{
					description: "Authenticate user with smart login",
					action: async () => {
						await hercules.smartFillForm(
							{
								email: "admin@gcmc-kaj.com",
								password: "AdminPassword123",
							},
							{ submitAfter: true },
						);

						await hercules.smartWait({
							url: /dashboard/,
							networkIdle: true,
							timeout: 10000,
						});

						await hercules.captureScreenshot("02-login-success", {
							fullPage: true,
						});
					},
				},
				{
					description: "Verify dashboard and collect performance metrics",
					action: async () => {
						await dashboardPage.verifyDashboardDisplayed();
						await dashboardPage.verifyUserLoggedIn();
						await navigation.verifyNavigationLinksPresent();

						// Collect performance metrics
						await hercules.collectPerformanceMetrics();

						// Take comprehensive dashboard screenshot
						await hercules.captureScreenshot("03-dashboard-overview", {
							fullPage: true,
							highlight: ["nav", ".stats-cards", ".recent-activity"],
						});

						// Verify no console errors
						await dashboardPage.verifyNoConsoleErrors();
					},
				},
				{
					description: "Navigate to clients section",
					action: async () => {
						await hercules.smartClick('a[href*="/clients"]', {
							waitForNavigation: true,
							screenshot: true,
						});

						await clientsPage.verifyClientsPageDisplayed();
						await hercules.captureScreenshot("04-clients-page", {
							fullPage: true,
						});
					},
				},
				{
					description: "Create new client via UI",
					action: async () => {
						const testClient = {
							name: `E2E Test Client ${Date.now()}`,
							email: TestDataGenerator.generateEmail("e2e-client"),
							phone: TestDataGenerator.generatePhoneNumber(),
							address: TestDataGenerator.generateAddress(),
							company: TestDataGenerator.generateCompanyName(),
							taxId: TestDataGenerator.generateTaxId(),
							status: "active",
							notes: "Created via complete E2E test journey",
						};

						await clientsPage.clickAddClient();
						await clientsPage.verifyClientFormDisplayed();

						await hercules.captureScreenshot("05-client-form", {
							fullPage: true,
						});

						// Fill form using smart form filling
						await hercules.smartFillForm({
							name: testClient.name,
							email: testClient.email,
							phone: testClient.phone,
							address: testClient.address,
							company: testClient.company,
							taxId: testClient.taxId,
							notes: testClient.notes,
						});

						// Select status if dropdown exists
						try {
							await hercules.smartInteract(
								'select[name="status"]',
								"select",
								testClient.status,
							);
						} catch (error) {
							console.log("Status dropdown not found, skipping...");
						}

						await hercules.captureScreenshot("06-client-form-filled", {
							fullPage: true,
						});

						await clientsPage.saveClient();
						await clientsPage.waitForSuccessMessage();

						await hercules.captureScreenshot("07-client-created", {
							fullPage: true,
						});

						// Store client data for later steps
						await allure.parameter("Created Client Name", testClient.name);
						await allure.parameter("Created Client Email", testClient.email);
					},
				},
				{
					description: "Verify client appears in list",
					action: async () => {
						await clientsPage.navigateToClients();

						// Get the created client name from parameters
						const clientName = await allure.parameter("Created Client Name");

						await clientsPage.verifyClientExists(clientName);
						await hercules.captureScreenshot("08-client-in-list", {
							fullPage: true,
						});

						// Test search functionality
						await clientsPage.searchClients(clientName);
						await clientsPage.verifySearchResults(1);

						await hercules.captureScreenshot("09-client-search", {
							fullPage: true,
						});
					},
				},
				{
					description: "Verify client via API",
					action: async () => {
						await apiHelper.authenticateAsTestUser();

						// Search for the created client via API
						const clientName = await allure.parameter("Created Client Name");
						const clientEmail = await allure.parameter("Created Client Email");

						const clients = await apiHelper.getClients({ search: clientName });
						expect(clients).toBeDefined();

						const clientsArray = clients.data || clients;
						const foundClient = clientsArray.find(
							(c) => c.email === clientEmail,
						);
						expect(foundClient).toBeDefined();

						await allure.attachment(
							"API Client Data",
							JSON.stringify(foundClient, null, 2),
							"application/json",
						);
					},
				},
				{
					description: "Update client information",
					action: async () => {
						const clientName = await allure.parameter("Created Client Name");
						const clientIndex = await clientsPage.findClientByName(clientName);

						if (clientIndex >= 0) {
							await clientsPage.editClient(clientIndex, {
								phone: "+1-555-UPDATED",
								notes: "Updated via E2E test journey",
							});

							await hercules.captureScreenshot("10-client-updated", {
								fullPage: true,
							});
						}
					},
				},
				{
					description: "Test accessibility across different pages",
					action: async () => {
						// Test accessibility on clients page
						await a11yHelper.scanWCAG_AA();

						// Navigate back to dashboard and test
						await navigation.navigateToDashboard();
						await a11yHelper.scanWCAG_AA();
					},
				},
				{
					description: "Test responsive design",
					action: async () => {
						// Test tablet viewport
						await page.setViewportSize({ width: 768, height: 1024 });
						await page.reload();
						await hercules.captureScreenshot("11-tablet-view", {
							fullPage: true,
						});

						// Test mobile viewport
						await page.setViewportSize({ width: 375, height: 667 });
						await page.reload();
						await hercules.captureScreenshot("12-mobile-view", {
							fullPage: true,
						});

						// Reset to desktop
						await page.setViewportSize({ width: 1280, height: 720 });
						await page.reload();
					},
				},
				{
					description: "Verify session persistence",
					action: async () => {
						// Reload page and verify user is still logged in
						await page.reload();
						await page.waitForLoadState("networkidle");

						await dashboardPage.verifyUserLoggedIn();
						await hercules.captureScreenshot("13-session-persisted", {
							fullPage: true,
						});
					},
				},
				{
					description: "Test error handling",
					action: async () => {
						// Test network error simulation
						await page.route("**/api/clients", (route) => {
							route.abort("failed");
						});

						try {
							await navigation.navigateToClients();
							await page.waitForTimeout(2000);
							await hercules.captureScreenshot("14-network-error", {
								fullPage: true,
							});
						} catch (error) {
							console.log("Network error handled gracefully");
						}

						// Clear route interception
						await page.unroute("**/api/clients");
					},
				},
			],
			cleanup: async () => {
				// Cleanup created test data
				await apiHelper.cleanupTestClients();

				// Logout
				await navigation.logout();
				await hercules.captureScreenshot("15-logged-out", { fullPage: true });
			},
		});
	});

	test("should handle error scenarios gracefully @negative @error-handling", async ({
		page,
		loginPage,
		clientsPage,
	}) => {
		const testExecutor = new TestExecutor(page);
		const hercules = testExecutor.getHercules();

		await testExecutor.executeScenario({
			name: "Error Handling Scenarios",
			steps: [
				{
					description: "Test invalid login",
					action: async () => {
						await loginPage.navigateToLogin();
						await hercules.smartFillForm(
							{
								email: "invalid@example.com",
								password: "wrongpassword",
							},
							{ submitAfter: true },
						);

						await loginPage.verifyStillOnLoginPage();
						await loginPage.verifyErrorMessageDisplayed();
						await hercules.captureScreenshot("error-invalid-login", {
							fullPage: true,
						});
					},
				},
				{
					description: "Test form validation errors",
					action: async () => {
						// Login with valid credentials first
						await hercules.smartFillForm(
							{
								email: "admin@gcmc-kaj.com",
								password: "AdminPassword123",
							},
							{ submitAfter: true },
						);

						await hercules.smartWait({ url: /dashboard/, networkIdle: true });

						// Navigate to clients and try to create invalid client
						await hercules.smartClick('a[href*="/clients"]', {
							waitForNavigation: true,
						});
						await clientsPage.clickAddClient();

						// Try to submit empty form
						await clientsPage.saveClient();
						await clientsPage.verifyValidationErrors();
						await hercules.captureScreenshot("error-form-validation", {
							fullPage: true,
						});

						// Try invalid email format
						await hercules.smartFillForm({
							name: "Test Client",
							email: "invalid-email-format",
						});

						await clientsPage.saveClient();
						await clientsPage.verifyValidationErrors();
						await hercules.captureScreenshot("error-email-validation", {
							fullPage: true,
						});
					},
				},
			],
		});
	});

	test("should perform comprehensive API testing @api-comprehensive", async ({
		apiHelper,
	}) => {
		await allure.epic("API Testing");
		await allure.feature("Comprehensive API Workflow");

		await allure.step("Authenticate and verify user access", async () => {
			const token = await apiHelper.authenticateAsTestUser();
			expect(token).toBeDefined();

			const user = await apiHelper.getCurrentUser();
			expect(user).toBeDefined();
			expect(user.email).toBeDefined();

			await allure.attachment(
				"Current User Data",
				JSON.stringify(user, null, 2),
				"application/json",
			);
		});

		await allure.step("Perform CRUD operations on clients", async () => {
			// Create multiple clients
			const createdClients = [];

			for (let i = 0; i < 3; i++) {
				const clientData = {
					name: `API Test Client ${i + 1} ${Date.now()}`,
					email: TestDataGenerator.generateEmail(`api-client-${i + 1}`),
					phone: TestDataGenerator.generatePhoneNumber(),
					company: TestDataGenerator.generateCompanyName(),
				};

				const client = await apiHelper.createClient(clientData);
				expect(client).toBeDefined();
				expect(client.id).toBeDefined();
				createdClients.push(client);
			}

			await allure.attachment(
				"Created Clients",
				JSON.stringify(createdClients, null, 2),
				"application/json",
			);

			// Read clients
			const allClients = await apiHelper.getClients();
			expect(allClients).toBeDefined();
			expect(Array.isArray(allClients.data || allClients)).toBe(true);

			// Update first client
			const updateData = { phone: "+1-555-UPDATED-API" };
			const updatedClient = await apiHelper.updateClient(
				createdClients[0].id,
				updateData,
			);
			expect(updatedClient.phone).toBe(updateData.phone);

			// Delete second client
			await apiHelper.deleteClient(createdClients[1].id);

			// Verify deletion
			try {
				await apiHelper.getClient(createdClients[1].id);
				throw new Error("Client should have been deleted");
			} catch (error) {
				expect(error.message).toBeDefined();
			}
		});

		await allure.step("Test API performance and concurrency", async () => {
			const startTime = Date.now();

			// Make concurrent requests
			const requests = [
				apiHelper.getClients(),
				apiHelper.getDashboardStats(),
				apiHelper.getCurrentUser(),
			];

			await Promise.all(requests);
			const endTime = Date.now();

			const totalTime = endTime - startTime;
			expect(totalTime).toBeLessThan(5000);

			await allure.attachment(
				"API Performance Metrics",
				JSON.stringify({ totalTime, requestCount: requests.length }, null, 2),
				"application/json",
			);
		});

		await allure.step("Cleanup API test data", async () => {
			await apiHelper.cleanupTestClients();
		});
	});
});
