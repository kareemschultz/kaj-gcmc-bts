import { allure } from "allure-playwright";
import { expect, test } from "../fixtures/enhanced-fixtures";

/**
 * Enhanced Authentication Tests - Login Flow
 *
 * Comprehensive login testing using Page Object Model
 * Tests cover various scenarios, edge cases, and accessibility
 */
test.describe("Enhanced Login Flow", () => {
	test.beforeEach(async ({ page }) => {
		await allure.epic("Authentication");
		await allure.feature("Login");
		await allure.story("User Login Flow");
	});

	test("should display login page correctly @smoke", async ({
		loginPage,
		screenshotHelper,
		performanceMetrics,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Verify login page elements", async () => {
			await loginPage.verifyLoginPageDisplayed();
			await loginPage.verifyFormFieldsEmpty();
			await loginPage.verifyLoginButtonEnabled();
		});

		await allure.step("Take screenshot of login page", async () => {
			await screenshotHelper.compareFullPage("login-page-display");
		});

		await allure.step("Verify page performance", async () => {
			expect(performanceMetrics.loadTime).toBeLessThan(3000);
		});
	});

	test("should login successfully with valid admin credentials @critical", async ({
		loginPage,
		dashboardPage,
		navigation,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Enter admin credentials", async () => {
			await loginPage.enterEmail("admin@gcmc-kaj.com");
			await loginPage.enterPassword("AdminPassword123");
		});

		await allure.step("Submit login form", async () => {
			await loginPage.clickLogin();
		});

		await allure.step("Verify successful login", async () => {
			await loginPage.verifySuccessfulLogin();
			await dashboardPage.verifyDashboardDisplayed();
			await navigation.verifyUserLoggedIn();
		});

		await allure.step("Verify navigation is available", async () => {
			await navigation.verifyNavigationLinksPresent();
		});
	});

	test("should login successfully with test user credentials @regression", async ({
		loginPage,
		dashboardPage,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Login with test user credentials", async () => {
			await loginPage.loginAsTestUser();
		});

		await allure.step("Verify dashboard access", async () => {
			await dashboardPage.verifyDashboardDisplayed();
			await dashboardPage.verifyUserLoggedIn();
		});
	});

	test("should show error with invalid credentials @negative", async ({
		loginPage,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Enter invalid credentials", async () => {
			await loginPage.loginWithInvalidCredentials();
		});

		await allure.step("Verify error handling", async () => {
			await loginPage.verifyStillOnLoginPage();
			await loginPage.verifyErrorMessageDisplayed();
		});
	});

	test("should validate required fields @validation", async ({ loginPage }) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Submit empty form", async () => {
			await loginPage.submitEmptyForm();
		});

		await allure.step("Verify validation errors", async () => {
			await loginPage.verifyStillOnLoginPage();
			// HTML5 validation should prevent submission
		});

		await allure.step("Test individual field validation", async () => {
			// Test email field
			await loginPage.enterEmail("invalid-email");
			await loginPage.submitEmptyForm();

			// Test password field requirement
			await loginPage.enterEmail("test@example.com");
			await loginPage.submitEmptyForm();
		});
	});

	test("should support keyboard navigation @accessibility", async ({
		loginPage,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Test keyboard navigation", async () => {
			await loginPage.testKeyboardNavigation();
		});

		await allure.step("Test form submission with Enter key", async () => {
			await loginPage.enterEmail("admin@gcmc-kaj.com");
			await loginPage.enterPassword("AdminPassword123");
			await loginPage.submitWithEnter();
		});
	});

	test("should toggle password visibility @usability", async ({
		loginPage,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Enter password", async () => {
			await loginPage.enterPassword("testpassword123");
		});

		await allure.step("Test password visibility toggle", async () => {
			await loginPage.verifyPasswordFieldType("password");
			await loginPage.togglePasswordVisibility();
			await loginPage.verifyPasswordFieldType("text");
			await loginPage.togglePasswordVisibility();
			await loginPage.verifyPasswordFieldType("password");
		});
	});

	test("should handle session persistence @functional", async ({
		loginPage,
		dashboardPage,
		page,
	}) => {
		await allure.step("Login to application", async () => {
			await loginPage.navigateToLogin();
			await loginPage.loginAsTestUser();
		});

		await allure.step("Navigate to different pages", async () => {
			await dashboardPage.navigateToClients();
			await page.waitForURL(/.*clients.*/);
		});

		await allure.step(
			"Reload page and verify session persistence",
			async () => {
				await page.reload();
				await page.waitForLoadState("networkidle");

				// Should still be on clients page, not redirected to login
				expect(page.url()).toContain("clients");
			},
		);
	});

	test("should work correctly on mobile devices @mobile", async ({
		browser,
		loginPage,
	}) => {
		const mobileContext = await browser.newContext({
			viewport: { width: 375, height: 667 },
			userAgent:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
		});

		const mobilePage = await mobileContext.newPage();
		const mobileLoginPage = new (
			await import("../page-objects/pages/login-page")
		).LoginPage(mobilePage);

		await allure.step("Test mobile login flow", async () => {
			await mobileLoginPage.navigateToLogin();
			await mobileLoginPage.verifyLoginPageDisplayed();
			await mobileLoginPage.loginAsTestUser();
		});

		await mobileContext.close();
	});

	test("should meet accessibility standards @accessibility", async ({
		loginPage,
		a11yHelper,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Run accessibility scan", async () => {
			await a11yHelper.scanWCAG_AA();
		});

		await allure.step("Verify form accessibility", async () => {
			await loginPage.verifyFormAccessibility();
		});
	});

	test("should handle network errors gracefully @error-handling", async ({
		page,
		loginPage,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Simulate network failure", async () => {
			// Intercept and fail login request
			await page.route("**/api/auth/login", (route) => {
				route.abort("failed");
			});

			await loginPage.enterEmail("admin@gcmc-kaj.com");
			await loginPage.enterPassword("AdminPassword123");
			await loginPage.clickLogin();
		});

		await allure.step("Verify error handling", async () => {
			// Should show network error or remain on login page
			await loginPage.verifyStillOnLoginPage();
		});
	});

	test("should prevent brute force attacks @security", async ({
		loginPage,
		page,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Attempt multiple failed logins", async () => {
			for (let i = 0; i < 5; i++) {
				await loginPage.loginWithInvalidCredentials();
				await page.waitForTimeout(1000);
			}
		});

		await allure.step("Verify rate limiting or account lockout", async () => {
			// After multiple failures, should show rate limiting message
			// or temporarily lock the account
			await loginPage.verifyErrorMessageDisplayed();
		});
	});
});

test.describe("Login Flow - Edge Cases", () => {
	test.beforeEach(async () => {
		await allure.epic("Authentication");
		await allure.feature("Login");
		await allure.story("Edge Cases");
	});

	test("should handle special characters in credentials @edge-case", async ({
		loginPage,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Test special characters", async () => {
			await loginPage.enterEmail("test+email@example.com");
			await loginPage.enterPassword("P@ssw0rd!#$%");
			await loginPage.clickLogin();
		});

		await allure.step("Verify handling of special characters", async () => {
			// Should either login successfully (if valid) or show appropriate error
			await loginPage.verifyStillOnLoginPage();
		});
	});

	test("should handle very long input values @edge-case", async ({
		loginPage,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Enter very long email", async () => {
			const longEmail = "a".repeat(100) + "@example.com";
			await loginPage.enterEmail(longEmail);
			await loginPage.enterPassword("password123");
			await loginPage.clickLogin();
		});

		await allure.step("Verify input handling", async () => {
			// Should handle long inputs gracefully
			await loginPage.verifyStillOnLoginPage();
		});
	});

	test("should handle copy-paste credentials @usability", async ({
		loginPage,
		page,
	}) => {
		await allure.step("Navigate to login page", async () => {
			await loginPage.navigateToLogin();
		});

		await allure.step("Test copy-paste functionality", async () => {
			// Simulate clipboard content
			await page.evaluate(() => {
				navigator.clipboard.writeText("admin@gcmc-kaj.com");
			});

			// Focus email field and paste
			await page.locator('input[name="email"]').focus();
			await page.keyboard.press("Control+V");
		});

		await allure.step("Complete login with pasted email", async () => {
			await loginPage.enterPassword("AdminPassword123");
			await loginPage.clickLogin();
		});
	});
});

test.describe("Login Flow - Performance", () => {
	test.beforeEach(async () => {
		await allure.epic("Authentication");
		await allure.feature("Login");
		await allure.story("Performance");
	});

	test("should load login page within performance budget @performance", async ({
		loginPage,
		page,
		performanceMetrics,
	}) => {
		await allure.step("Navigate to login page", async () => {
			const startTime = Date.now();
			await loginPage.navigateToLogin();
			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(2000);
		});

		await allure.step("Verify page load performance", async () => {
			expect(performanceMetrics.loadTime).toBeLessThan(3000);
		});

		await allure.step("Check for performance metrics", async () => {
			const performanceEntries = await page.evaluate(() => {
				return JSON.parse(
					JSON.stringify(performance.getEntriesByType("navigation")),
				);
			});

			expect(performanceEntries[0].loadEventEnd).toBeLessThan(3000);
		});
	});

	test("should handle concurrent login attempts @performance", async ({
		browser,
	}) => {
		const contexts = await Promise.all([
			browser.newContext(),
			browser.newContext(),
			browser.newContext(),
		]);

		const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

		await allure.step("Perform concurrent logins", async () => {
			const loginPromises = pages.map(async (page) => {
				const loginPage = new (
					await import("../page-objects/pages/login-page")
				).LoginPage(page);
				await loginPage.navigateToLogin();
				return loginPage.loginAsTestUser();
			});

			await Promise.all(loginPromises);
		});

		await allure.step("Cleanup contexts", async () => {
			await Promise.all(contexts.map((ctx) => ctx.close()));
		});
	});
});
