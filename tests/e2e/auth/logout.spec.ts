import { expect, test } from "../../fixtures/base-fixtures";

/**
 * Authentication Tests - Logout
 *
 * Tests logout functionality and session cleanup.
 */
test.describe("Logout Flow", () => {
	test("should logout successfully", async ({
		authenticatedPage,
		authHelper,
	}) => {
		const page = authenticatedPage;

		// Start from dashboard
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/dashboard/);

		// Logout
		await authHelper.logout();

		// Verify redirected to login
		await expect(page).toHaveURL(/\/login/);
	});

	test("should clear session after logout", async ({
		authenticatedPage,
		authHelper,
	}) => {
		const page = authenticatedPage;

		// Start from dashboard
		await page.goto("/dashboard");

		// Logout
		await authHelper.logout();

		// Try to access protected route
		await page.goto("/dashboard");

		// Should be redirected to login
		await expect(page).toHaveURL(/\/login/);
	});

	test("should not allow back navigation after logout", async ({
		authenticatedPage,
		authHelper,
	}) => {
		const page = authenticatedPage;

		// Visit dashboard
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/dashboard/);

		// Logout
		await authHelper.logout();

		// Try to go back
		await page.goBack();

		// Should still be on login or redirected
		const url = page.url();
		expect(url).toMatch(/login/);
	});
});
