import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Authentication Helper for E2E Tests
 *
 * Provides methods for login, logout, and session management.
 */
export class AuthHelper {
	constructor(private page: Page) {}

	/**
	 * Get the base URL from environment
	 */
	private getBaseURL(): string {
		return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
	}

	/**
	 * Login with email and password
	 */
	async login(email: string, password: string) {
		const baseURL = this.getBaseURL();
		await this.page.goto(`${baseURL}/login`);

		// Fill in credentials
		await this.page.fill('input[name="email"]', email);
		await this.page.fill('input[name="password"]', password);

		// Submit form
		await this.page.click('button[type="submit"]');

		// Wait for redirect to dashboard
		await this.page.waitForURL("**/dashboard", { timeout: 10000 });

		// Verify login success
		await expect(this.page).toHaveURL(/\/dashboard/);
	}

	/**
	 * Login as test admin user
	 */
	async loginAsAdmin() {
		await this.login("admin@test.gcmc.com", "TestPassword123!");
	}

	/**
	 * Login as regular test user
	 */
	async loginAsUser() {
		await this.login("user@test.gcmc.com", "TestPassword123!");
	}

	/**
	 * Login as client user
	 */
	async loginAsClient() {
		await this.login("client@test.gcmc.com", "TestPassword123!");
	}

	/**
	 * Logout current user
	 */
	async logout() {
		// Click user menu
		await this.page.click('[data-testid="user-menu"]', { timeout: 5000 });

		// Click logout button
		await this.page.click('button:has-text("Logout")', { timeout: 5000 });

		// Wait for redirect to login
		await this.page.waitForURL("**/login", { timeout: 10000 });

		// Verify logout success
		await expect(this.page).toHaveURL(/\/login/);
	}

	/**
	 * Check if user is authenticated
	 */
	async isAuthenticated(): Promise<boolean> {
		const currentURL = this.page.url();
		return !currentURL.includes("/login");
	}

	/**
	 * Get current user's display name from UI
	 */
	async getCurrentUserName(): Promise<string | null> {
		try {
			const userMenu = await this.page.locator('[data-testid="user-menu"]');
			return await userMenu.textContent();
		} catch {
			return null;
		}
	}

	/**
	 * Verify user has specific role
	 */
	async verifyUserRole(expectedRole: string) {
		// Navigate to profile or settings to check role
		const baseURL = this.getBaseURL();
		await this.page.goto(`${baseURL}/dashboard`);

		// Check if admin menu items are visible for admin role
		if (expectedRole === "admin") {
			const adminLink = this.page.locator('a[href*="/admin"]');
			await expect(adminLink).toBeVisible();
		}
	}

	/**
	 * Setup session storage for authenticated state
	 */
	async setupAuthenticatedSession(storageState: string) {
		await this.page.context().addCookies(JSON.parse(storageState).cookies);
	}

	/**
	 * Clear all cookies and storage
	 */
	async clearSession() {
		await this.page.context().clearCookies();
		await this.page.evaluate(() => {
			localStorage.clear();
			sessionStorage.clear();
		});
	}
}
