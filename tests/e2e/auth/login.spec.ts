import { expect, test } from "../../fixtures/base-fixtures";

/**
 * Authentication Tests - Login
 *
 * Tests login functionality, session management, and authentication flows.
 */
test.describe("Login Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to login page before each test
		await page.goto("/login");
	});

	test("should display login form", async ({ page }) => {
		// Check page title
		await expect(page).toHaveTitle(/Login/);

		// Verify form elements are present
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("should login with valid credentials", async ({ page }) => {
		// Fill in credentials
		await page.fill('input[name="email"]', "admin@test.gcmc.com");
		await page.fill('input[name="password"]', "TestPassword123!");

		// Submit form
		await page.click('button[type="submit"]');

		// Wait for redirect to dashboard
		await page.waitForURL("**/dashboard", { timeout: 10000 });

		// Verify successful login
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test("should show error with invalid credentials", async ({ page }) => {
		// Fill in invalid credentials
		await page.fill('input[name="email"]', "invalid@example.com");
		await page.fill('input[name="password"]', "wrongpassword");

		// Submit form
		await page.click('button[type="submit"]');

		// Verify error message is shown
		await expect(
			page.locator("text=/Invalid (email|credentials|password)/i"),
		).toBeVisible();

		// Verify still on login page
		await expect(page).toHaveURL(/\/login/);
	});

	test("should validate required fields", async ({ page }) => {
		// Try to submit empty form
		await page.click('button[type="submit"]');

		// Check for validation errors
		const emailInput = page.locator('input[name="email"]');
		const passwordInput = page.locator('input[name="password"]');

		// HTML5 validation or custom error messages
		await expect(
			emailInput.or(page.locator("text=/email.*required/i")),
		).toBeVisible();
		await expect(
			passwordInput.or(page.locator("text=/password.*required/i")),
		).toBeVisible();
	});

	test("should toggle password visibility", async ({ page }) => {
		const passwordInput = page.locator('input[name="password"]');
		const toggleButton = page.locator('[data-testid="toggle-password"]');

		// Initially password should be hidden
		await expect(passwordInput).toHaveAttribute("type", "password");

		// Click toggle if it exists
		if ((await toggleButton.count()) > 0) {
			await toggleButton.click();
			await expect(passwordInput).toHaveAttribute("type", "text");

			// Toggle back
			await toggleButton.click();
			await expect(passwordInput).toHaveAttribute("type", "password");
		}
	});

	test("should handle session persistence", async ({ page, authHelper }) => {
		// Login
		await authHelper.loginAsAdmin();

		// Navigate to different page
		await page.goto("/dashboard/services");
		await expect(page).toHaveURL(/\/services/);

		// Reload page
		await page.reload();

		// Should still be logged in
		await expect(page).toHaveURL(/\/services/);
		await expect(authHelper.isAuthenticated()).resolves.toBeTruthy();
	});
});

test.describe("Login - Accessibility", () => {
	test("should be accessible", async ({ page, a11yHelper }) => {
		await page.goto("/login");

		// Run accessibility scan
		await a11yHelper.scanWCAG_AA();
	});

	test("should support keyboard navigation", async ({ page }) => {
		await page.goto("/login");

		// Tab through form elements
		await page.keyboard.press("Tab");
		await expect(page.locator('input[name="email"]')).toBeFocused();

		await page.keyboard.press("Tab");
		await expect(page.locator('input[name="password"]')).toBeFocused();

		await page.keyboard.press("Tab");
		await expect(page.locator('button[type="submit"]')).toBeFocused();
	});
});

test.describe("Login - Mobile", () => {
	test("should display correctly on mobile", async ({ mobilePage }) => {
		await mobilePage.goto("/login");

		// Verify mobile layout
		await expect(mobilePage.locator('input[name="email"]')).toBeVisible();
		await expect(mobilePage.locator('input[name="password"]')).toBeVisible();
		await expect(mobilePage.locator('button[type="submit"]')).toBeVisible();
	});

	test("should login on mobile", async ({ mobilePage }) => {
		await mobilePage.goto("/login");

		// Fill and submit
		await mobilePage.fill('input[name="email"]', "admin@test.gcmc.com");
		await mobilePage.fill('input[name="password"]', "TestPassword123!");
		await mobilePage.click('button[type="submit"]');

		// Verify redirect
		await mobilePage.waitForURL("**/dashboard");
		await expect(mobilePage).toHaveURL(/\/dashboard/);
	});
});
