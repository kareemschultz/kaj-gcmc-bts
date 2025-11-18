/**
 * E2E Tests for Guyana Compliance Dashboard
 */

import { expect, type Page, test } from "@playwright/test";

// Helper function to mock API responses
async function mockApiResponses(page: Page) {
	// Mock dashboard overview
	await page.route("**/api/trpc/dashboard.overview*", (route) => {
		route.fulfill({
			json: {
				result: {
					data: {
						counts: { clients: 50 },
						alerts: { overdueFilings: 3 },
					},
				},
			},
		});
	});

	// Mock compliance overview
	await page.route("**/api/trpc/dashboard.complianceOverview*", (route) => {
		route.fulfill({
			json: {
				result: {
					data: {
						byLevel: { high: 42 },
					},
				},
			},
		});
	});

	// Mock Guyana compliance stats
	await page.route("**/api/trpc/guyana.complianceStats*", (route) => {
		route.fulfill({
			json: {
				result: {
					data: {
						upcomingDeadlines: 7,
						totalPenalties: 2500,
					},
				},
			},
		});
	});

	// Mock Guyana filing status
	await page.route("**/api/trpc/guyana.filingStatus*", (route) => {
		route.fulfill({
			json: {
				result: {
					data: {
						submitted: 35,
						inProgress: 8,
						pending: 5,
						overdue: 2,
					},
				},
			},
		});
	});
}

test.describe("Guyana Compliance Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		await mockApiResponses(page);
		await page.goto("/dashboard/guyana-compliance");
	});

	test("should display main dashboard title and description", async ({
		page,
	}) => {
		await expect(page.getByText("Guyana Tax Compliance")).toBeVisible();
		await expect(
			page.getByText("GRA & GRT compliance tracking for your clients"),
		).toBeVisible();
	});

	test("should display compliance rate metric correctly", async ({ page }) => {
		// Should display 84.0% (42/50 * 100)
		await expect(page.getByText("84.0%")).toBeVisible();

		// Should show progress bar
		await expect(page.locator('[role="progressbar"]')).toBeVisible();

		// Should show client count breakdown
		await expect(page.getByText("42 of 50 clients")).toBeVisible();
	});

	test("should display upcoming deadlines with warning state", async ({
		page,
	}) => {
		await expect(page.getByText("Upcoming Deadlines")).toBeVisible();
		await expect(page.getByText("7")).toBeVisible();
		await expect(page.getByText("Next 30 days")).toBeVisible();

		// Should show action required badge for upcoming deadlines
		await expect(page.getByText("Action Required")).toBeVisible();
	});

	test("should display overdue filings with critical state", async ({
		page,
	}) => {
		await expect(page.getByText("Overdue Filings")).toBeVisible();
		await expect(page.getByText("3")).toBeVisible();
		await expect(page.getByText("Immediate attention")).toBeVisible();

		// Should show critical badge
		await expect(page.getByText("Critical")).toBeVisible();
	});

	test("should display total penalties correctly formatted", async ({
		page,
	}) => {
		await expect(page.getByText("Total Penalties")).toBeVisible();
		await expect(page.getByText("$2,500")).toBeVisible();
		await expect(page.getByText("GYD accumulated")).toBeVisible();
	});

	test("should show filing status breakdown", async ({ page }) => {
		await expect(page.getByText("GRA Filing Status")).toBeVisible();

		// Check all status categories
		await expect(page.getByText("Submitted")).toBeVisible();
		await expect(page.getByText("35")).toBeVisible();

		await expect(page.getByText("In Progress")).toBeVisible();
		await expect(page.getByText("8")).toBeVisible();

		await expect(page.getByText("Pending")).toBeVisible();
		await expect(page.getByText("5")).toBeVisible();

		await expect(page.getByText("Overdue")).toBeVisible();
		await expect(page.getByText("2")).toBeVisible();
	});

	test("should display quick action buttons", async ({ page }) => {
		await expect(page.getByText("Quick Actions")).toBeVisible();

		// Check all action buttons are present
		await expect(
			page.getByRole("button", { name: "Generate Tax Return" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Check Filing Calendar" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Update Client Info" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Calculate Penalties" }),
		).toBeVisible();
	});

	test("should show compliance report generation button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: "Generate Compliance Report" }),
		).toBeVisible();
	});

	test("quick action buttons should be interactive", async ({ page }) => {
		const generateButton = page.getByRole("button", {
			name: "Generate Tax Return",
		});
		await expect(generateButton).toBeEnabled();

		// Click should not cause errors (button functionality would be tested separately)
		await generateButton.click();
	});

	test("should handle loading state gracefully", async ({ page }) => {
		// Mock slow API response
		await page.route("**/api/trpc/dashboard.overview*", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			route.fulfill({
				json: {
					result: { data: { counts: { clients: 50 } } },
				},
			});
		});

		await page.goto("/dashboard/guyana-compliance");

		// Should show loading skeletons initially
		await expect(page.locator(".skeleton")).toBeVisible();
	});

	test("should handle API errors gracefully", async ({ page }) => {
		// Mock API error
		await page.route("**/api/trpc/dashboard.overview*", (route) => {
			route.fulfill({
				status: 500,
				json: { error: "Server error" },
			});
		});

		await page.goto("/dashboard/guyana-compliance");

		// Should still render the dashboard structure with default values
		await expect(page.getByText("Guyana Tax Compliance")).toBeVisible();
		await expect(page.getByText("0.0%")).toBeVisible(); // Default compliance rate
	});

	test("should be responsive on mobile devices", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

		// Main content should still be visible
		await expect(page.getByText("Guyana Tax Compliance")).toBeVisible();

		// Metric cards should stack vertically on mobile
		const metricCards = page.locator(".grid.gap-4.md\\:grid-cols-4 > div");
		await expect(metricCards.first()).toBeVisible();
	});

	test("should show appropriate color coding for different metric states", async ({
		page,
	}) => {
		// Compliance rate should have brand color for good performance
		const complianceCard = page.locator("text=Compliance Rate").locator("..");
		await expect(complianceCard.locator(".border-l-brand")).toBeVisible();

		// Upcoming deadlines should have warning color
		const deadlinesCard = page.locator("text=Upcoming Deadlines").locator("..");
		await expect(deadlinesCard.locator(".border-l-warning")).toBeVisible();

		// Overdue filings should have destructive color
		const overdueCard = page.locator("text=Overdue Filings").locator("..");
		await expect(overdueCard.locator(".border-l-destructive")).toBeVisible();
	});

	test("should calculate and display percentage breakdowns correctly", async ({
		page,
	}) => {
		// Filing status percentages should be calculated correctly
		// Total: 35 + 8 + 5 + 2 = 50
		// Submitted: 35/50 = 70%
		await expect(page.getByText("70.0%")).toBeVisible();

		// In Progress: 8/50 = 16%
		await expect(page.getByText("16.0%")).toBeVisible();

		// Pending: 5/50 = 10%
		await expect(page.getByText("10.0%")).toBeVisible();

		// Overdue: 2/50 = 4%
		await expect(page.getByText("4.0%")).toBeVisible();
	});
});
