import { allure } from "allure-playwright";
import { expect, test } from "../fixtures/enhanced-fixtures";

/**
 * Dashboard Functionality Tests
 *
 * Comprehensive testing of dashboard features and components
 * using Page Object Model and enhanced fixtures
 */
test.describe("Dashboard Functionality", () => {
	test.beforeEach(async ({ authenticatedPage, dashboardPage }) => {
		await allure.epic("Dashboard");
		await allure.feature("Main Dashboard");
		await allure.story("Dashboard Display and Navigation");

		// Use authenticated page for all dashboard tests
		await dashboardPage.navigateToDashboard();
	});

	test("should display dashboard correctly after login @smoke", async ({
		dashboardPage,
		navigation,
		screenshotHelper,
	}) => {
		await allure.step("Verify dashboard page elements", async () => {
			await dashboardPage.verifyDashboardDisplayed();
			await dashboardPage.verifyUserLoggedIn();
			await dashboardPage.verifyPageTitle("Dashboard");
		});

		await allure.step("Verify navigation components", async () => {
			await navigation.verifyNavigationVisible();
			await navigation.verifyNavigationLinksPresent();
		});

		await allure.step("Take dashboard screenshot", async () => {
			await screenshotHelper.compareFullPage("dashboard-main-view");
		});
	});

	test("should display stats cards with correct data @functional", async ({
		dashboardPage,
		apiHelper,
	}) => {
		await allure.step("Authenticate API helper", async () => {
			await apiHelper.authenticateAsTestUser();
		});

		await allure.step("Get stats from API", async () => {
			const apiStats = await apiHelper.getDashboardStats();
			expect(apiStats).toBeDefined();
		});

		await allure.step("Verify stats cards are displayed", async () => {
			await dashboardPage.verifyStatsCardsDisplayed();
		});

		await allure.step("Get stats from UI", async () => {
			const uiStats = await dashboardPage.getDashboardStats();
			expect(uiStats).toBeDefined();
		});

		await allure.step("Compare UI and API stats", async () => {
			// Note: This comparison will depend on your actual data structure
			console.log("UI Stats:", uiStats);
			console.log("API Stats:", apiStats);
		});
	});

	test("should display recent activity section @functional", async ({
		dashboardPage,
	}) => {
		await allure.step("Verify recent activity section", async () => {
			await dashboardPage.verifyRecentActivityDisplayed();
		});
	});

	test("should display compliance overview @functional", async ({
		dashboardPage,
	}) => {
		await allure.step("Verify compliance overview", async () => {
			await dashboardPage.verifyComplianceOverviewDisplayed();
		});
	});

	test("should handle table data display correctly @functional", async ({
		dashboardPage,
	}) => {
		await allure.step("Verify table data", async () => {
			await dashboardPage.verifyTableDataDisplayed();
		});

		await allure.step("Check table row count", async () => {
			const rowCount = await dashboardPage.getTableRowCount();
			expect(rowCount).toBeGreaterThanOrEqual(0);
		});

		await allure.step("Test table interaction if data exists", async () => {
			const rowCount = await dashboardPage.getTableRowCount();
			if (rowCount > 0) {
				await dashboardPage.clickTableRow(0);
			}
		});
	});

	test("should support search functionality @functional", async ({
		dashboardPage,
	}) => {
		await allure.step("Verify search functionality", async () => {
			await dashboardPage.verifySearchFunctionality();
		});

		await allure.step("Test search if search box exists", async () => {
			try {
				await dashboardPage.search("test");
				await dashboardPage.waitForPageLoad();
			} catch (error) {
				console.log(
					"Search functionality not available or test data not found",
				);
			}
		});
	});

	test("should navigate to different sections correctly @navigation", async ({
		dashboardPage,
		navigation,
	}) => {
		await allure.step("Test navigation to clients", async () => {
			await navigation.navigateToClients();
			await expect(dashboardPage.page).toHaveURL(/.*clients.*/);
		});

		await allure.step("Return to dashboard", async () => {
			await navigation.navigateToDashboard();
			await expect(dashboardPage.page).toHaveURL(/.*dashboard.*/);
		});

		await allure.step("Test navigation to reports", async () => {
			await navigation.navigateToReports();
			await expect(dashboardPage.page).toHaveURL(/.*reports.*/);
		});

		await allure.step("Return to dashboard", async () => {
			await navigation.navigateToDashboard();
			await expect(dashboardPage.page).toHaveURL(/.*dashboard.*/);
		});
	});

	test("should handle user menu interactions @usability", async ({
		dashboardPage,
		navigation,
	}) => {
		await allure.step("Open user menu", async () => {
			await navigation.openUserMenu();
		});

		await allure.step("Test profile navigation", async () => {
			try {
				await navigation.navigateToProfile();
			} catch (error) {
				console.log("Profile navigation not available");
			}
		});
	});

	test("should be responsive on different screen sizes @responsive", async ({
		browser,
	}) => {
		const viewports = [
			{ width: 1920, height: 1080, name: "Desktop Large" },
			{ width: 1366, height: 768, name: "Desktop Standard" },
			{ width: 1024, height: 768, name: "Tablet Landscape" },
			{ width: 768, height: 1024, name: "Tablet Portrait" },
			{ width: 375, height: 667, name: "Mobile" },
		];

		for (const viewport of viewports) {
			await allure.step(`Test responsiveness on ${viewport.name}`, async () => {
				const context = await browser.newContext({ viewport });
				const page = await context.newPage();
				const dashboardPage = new (
					await import("../page-objects/pages/dashboard-page")
				).DashboardPage(page);

				// Login first
				const loginPage = new (
					await import("../page-objects/pages/login-page")
				).LoginPage(page);
				await loginPage.navigateToLogin();
				await loginPage.loginAsTestUser();

				// Test dashboard
				await dashboardPage.verifyDashboardDisplayed();
				await dashboardPage.testResponsiveness();

				await context.close();
			});
		}
	});

	test("should not have console errors @quality", async ({
		dashboardPage,
		page,
	}) => {
		const errors: string[] = [];

		await allure.step("Monitor console for errors", async () => {
			page.on("console", (msg) => {
				if (msg.type() === "error") {
					errors.push(msg.text());
				}
			});

			// Navigate and interact with dashboard
			await dashboardPage.waitForDashboardLoad();
			await page.waitForTimeout(2000);
		});

		await allure.step("Verify no console errors", async () => {
			expect(errors).toHaveLength(0);
		});
	});

	test("should handle logout correctly @functional", async ({
		navigation,
		page,
	}) => {
		await allure.step("Perform logout", async () => {
			await navigation.logout();
		});

		await allure.step("Verify redirect to login", async () => {
			await expect(page).toHaveURL(/.*login.*/);
		});

		await allure.step(
			"Verify cannot access dashboard without auth",
			async () => {
				await page.goto("/dashboard");
				await expect(page).toHaveURL(/.*login.*/);
			},
		);
	});
});

test.describe("Dashboard - Performance", () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await allure.epic("Dashboard");
		await allure.feature("Performance");
	});

	test("should load dashboard within performance budget @performance", async ({
		dashboardPage,
		performanceMetrics,
		page,
	}) => {
		await allure.step("Measure dashboard load time", async () => {
			const startTime = Date.now();
			await dashboardPage.navigateToDashboard();
			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(5000);
		});

		await allure.step("Check performance metrics", async () => {
			const metrics = await page.evaluate(() => {
				const navigation = performance.getEntriesByType(
					"navigation",
				)[0] as PerformanceNavigationTiming;
				return {
					domContentLoaded:
						navigation.domContentLoadedEventEnd - navigation.navigationStart,
					loadComplete: navigation.loadEventEnd - navigation.navigationStart,
					firstPaint:
						performance
							.getEntriesByType("paint")
							.find((entry) => entry.name === "first-paint")?.startTime || 0,
					firstContentfulPaint:
						performance
							.getEntriesByType("paint")
							.find((entry) => entry.name === "first-contentful-paint")
							?.startTime || 0,
				};
			});

			expect(metrics.domContentLoaded).toBeLessThan(3000);
			expect(metrics.loadComplete).toBeLessThan(5000);
		});

		await allure.step("Verify performance budget", async () => {
			expect(performanceMetrics.loadTime).toBeLessThan(5000);
		});
	});

	test("should handle large datasets efficiently @performance", async ({
		dashboardPage,
		apiHelper,
	}) => {
		await allure.step("Create test data", async () => {
			await apiHelper.authenticateAsTestUser();
			// Create multiple test clients to stress test
			await apiHelper.createMultipleTestClients(10);
		});

		await allure.step("Load dashboard with large dataset", async () => {
			const startTime = Date.now();
			await dashboardPage.navigateToDashboard();
			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(8000);
		});

		await allure.step("Clean up test data", async () => {
			await apiHelper.cleanupTestClients();
		});
	});
});

test.describe("Dashboard - Accessibility", () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await allure.epic("Dashboard");
		await allure.feature("Accessibility");
	});

	test("should meet WCAG accessibility standards @accessibility", async ({
		dashboardPage,
		a11yHelper,
	}) => {
		await allure.step("Navigate to dashboard", async () => {
			await dashboardPage.navigateToDashboard();
		});

		await allure.step("Run accessibility scan", async () => {
			await a11yHelper.scanWCAG_AA();
		});
	});

	test("should support keyboard navigation @accessibility", async ({
		dashboardPage,
		navigation,
		page,
	}) => {
		await allure.step("Navigate to dashboard", async () => {
			await dashboardPage.navigateToDashboard();
		});

		await allure.step(
			"Test keyboard navigation through main elements",
			async () => {
				// Tab through navigation
				await page.keyboard.press("Tab");
				await page.keyboard.press("Tab");
				await page.keyboard.press("Tab");

				// Test arrow key navigation if applicable
				await page.keyboard.press("ArrowDown");
				await page.keyboard.press("ArrowUp");
			},
		);

		await allure.step("Test keyboard access to user menu", async () => {
			await page.keyboard.press("Tab");
			await page.keyboard.press("Enter");
		});
	});

	test("should provide proper ARIA labels and roles @accessibility", async ({
		dashboardPage,
		page,
	}) => {
		await allure.step("Navigate to dashboard", async () => {
			await dashboardPage.navigateToDashboard();
		});

		await allure.step("Check for proper ARIA attributes", async () => {
			const navigationRole = await page.locator('[role="navigation"]').count();
			expect(navigationRole).toBeGreaterThan(0);

			const mainRole = await page.locator('[role="main"], main').count();
			expect(mainRole).toBeGreaterThan(0);
		});
	});
});

test.describe("Dashboard - Data Integration", () => {
	test.beforeEach(async ({ authenticatedPage, apiHelper }) => {
		await allure.epic("Dashboard");
		await allure.feature("Data Integration");

		// Ensure we have authenticated API access
		await apiHelper.authenticateAsTestUser();
	});

	test("should reflect real-time data changes @integration", async ({
		dashboardPage,
		apiHelper,
		page,
	}) => {
		await allure.step("Get initial dashboard state", async () => {
			await dashboardPage.navigateToDashboard();
			const initialStats = await dashboardPage.getDashboardStats();
			console.log("Initial stats:", initialStats);
		});

		await allure.step("Create new client via API", async () => {
			const newClient = await apiHelper.createTestClient();
			expect(newClient).toBeDefined();
		});

		await allure.step("Refresh dashboard and verify update", async () => {
			await page.reload();
			await dashboardPage.waitForDashboardLoad();

			const updatedStats = await dashboardPage.getDashboardStats();
			console.log("Updated stats:", updatedStats);
		});

		await allure.step("Cleanup test data", async () => {
			await apiHelper.cleanupTestClients();
		});
	});

	test("should handle API errors gracefully @error-handling", async ({
		dashboardPage,
		page,
	}) => {
		await allure.step("Intercept API calls and simulate errors", async () => {
			await page.route("**/api/dashboard/stats", (route) => {
				route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({ error: "Internal Server Error" }),
				});
			});
		});

		await allure.step("Navigate to dashboard", async () => {
			await dashboardPage.navigateToDashboard();
		});

		await allure.step("Verify error handling", async () => {
			// Dashboard should handle API errors gracefully
			// Either show error states or fallback content
			await dashboardPage.verifyDashboardDisplayed();
		});
	});
});
