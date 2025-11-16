import { test } from "@playwright/test";
import { ScreenshotHelper } from "../utils/screenshot-helper";

test.describe("Platform Screenshots", () => {
	test("capture key platform pages", async ({ page }) => {
		const screenshots = new ScreenshotHelper(page);

		// Navigate to the application
		await page.goto("http://localhost:3001");

		// Take screenshot of homepage/redirect
		await screenshots.takeFullPage("01-homepage");

		// Navigate to login page
		await page.goto("http://localhost:3001/login");
		await page.waitForLoadState("networkidle");
		await screenshots.takeFullPage("02-login-page");

		// Take a viewport screenshot of login form
		await screenshots.takeViewport("03-login-form");

		// Navigate to other pages (these might redirect to login but we can see the redirect behavior)
		const pages = [
			{ url: "/dashboard", name: "04-dashboard" },
			{ url: "/clients", name: "05-clients" },
			{ url: "/documents", name: "06-documents" },
			{ url: "/filings", name: "07-filings" },
			{ url: "/services", name: "08-services" },
			{ url: "/service-requests", name: "09-service-requests" },
			{ url: "/tasks", name: "10-tasks" },
			{ url: "/conversations", name: "11-conversations" },
			{ url: "/notifications", name: "12-notifications" },
			{ url: "/admin", name: "13-admin" },
		];

		for (const { url, name } of pages) {
			try {
				await page.goto(`http://localhost:3001${url}`);
				await page.waitForLoadState("networkidle", { timeout: 5000 });
				await screenshots.takeFullPage(name);
			} catch (error) {
				console.log(`Error capturing ${name}: ${error}`);
				// Continue with next page
			}
		}
	});
});