const { test, expect } = require("@testzeus/hercules");

test.describe("Performance Tests", () => {
	test("Page load times are acceptable", async ({ page }) => {
		const startTime = Date.now();

		await page.goto("/login");
		await page.waitForLoadState("networkidle");

		const loginLoadTime = Date.now() - startTime;
		expect(loginLoadTime).toBeLessThan(5000); // 5 seconds max

		// Login and test dashboard load time
		await page.fill('[name="email"]', "admin@gcmc-kaj.com");
		await page.fill('[name="password"]', "AdminPassword123");

		const dashboardStartTime = Date.now();
		await page.click('[type="submit"]');
		await page.waitForLoadState("networkidle");

		const dashboardLoadTime = Date.now() - dashboardStartTime;
		expect(dashboardLoadTime).toBeLessThan(3000); // 3 seconds max for dashboard

		console.log(`Login page load time: ${loginLoadTime}ms`);
		console.log(`Dashboard load time: ${dashboardLoadTime}ms`);
	});

	test("API response times are fast", async ({ page }) => {
		await page.goto("/login");
		await page.fill('[name="email"]', "admin@gcmc-kaj.com");
		await page.fill('[name="password"]', "AdminPassword123");
		await page.click('[type="submit"]');
		await page.waitForLoadState("networkidle");

		// Monitor API calls
		const apiCalls = [];
		page.on("response", (response) => {
			if (
				response.url().includes("/trpc/") ||
				response.url().includes("/api/")
			) {
				apiCalls.push({
					url: response.url(),
					status: response.status(),
					timing: response.timing(),
				});
			}
		});

		await page.goto("/clients");
		await page.waitForLoadState("networkidle");

		// Check API response times
		apiCalls.forEach((call) => {
			expect(call.status).toBe(200);
			console.log(`API call ${call.url}: ${call.status} - ${call.timing}ms`);
		});
	});
});
