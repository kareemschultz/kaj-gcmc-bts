import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "../common/base-page";

/**
 * Login Page Object
 *
 * Handles all interactions with the login page including:
 * - Form submission
 * - Field validation
 * - Authentication flows
 * - Error handling
 */
export class LoginPage extends BasePage {
	// Locators
	private readonly emailField: Locator;
	private readonly passwordField: Locator;
	private readonly loginButton: Locator;
	private readonly passwordToggle: Locator;
	private readonly errorMessage: Locator;
	private readonly validationMessage: Locator;
	private readonly forgotPasswordLink: Locator;
	private readonly rememberMeCheckbox: Locator;
	private readonly pageTitle: Locator;
	private readonly loginForm: Locator;

	constructor(page: Page) {
		super(page);

		// Initialize locators
		this.emailField = page.locator(
			'input[name="email"], input[type="email"], #email',
		);
		this.passwordField = page.locator(
			'input[name="password"], input[type="password"], #password',
		);
		this.loginButton = page.locator(
			'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")',
		);
		this.passwordToggle = page.locator(
			'[data-testid="toggle-password"], [data-cy="password-toggle"], .password-toggle',
		);
		this.errorMessage = page.locator(
			'[data-testid="error-message"], .error-message, .alert-error, text=/Invalid.*credentials/i',
		);
		this.validationMessage = page.locator(
			'.field-error, .validation-error, [role="alert"]',
		);
		this.forgotPasswordLink = page.locator(
			'a:has-text("Forgot"), a:has-text("Reset")',
		);
		this.rememberMeCheckbox = page.locator(
			'input[name="remember"], input[type="checkbox"]:near(:text("Remember"))',
		);
		this.pageTitle = page.locator("h1, h2, .login-title");
		this.loginForm = page.locator('form, [data-testid="login-form"]');
	}

	/**
	 * Navigate to login page
	 */
	async navigateToLogin(): Promise<void> {
		await this.goto("/login");
		await this.waitForLoginPageLoad();
	}

	/**
	 * Wait for login page to load completely
	 */
	async waitForLoginPageLoad(): Promise<void> {
		await this.waitForPageLoad();
		await this.waitForElement(this.emailField);
		await this.waitForElement(this.passwordField);
		await this.waitForElement(this.loginButton);
	}

	/**
	 * Enter email address
	 */
	async enterEmail(email: string): Promise<void> {
		await this.clearAndFill(this.emailField, email);
	}

	/**
	 * Enter password
	 */
	async enterPassword(password: string): Promise<void> {
		await this.clearAndFill(this.passwordField, password);
	}

	/**
	 * Click login button
	 */
	async clickLogin(): Promise<void> {
		await this.click(this.loginButton);
	}

	/**
	 * Complete login flow with credentials
	 */
	async login(email: string, password: string): Promise<void> {
		await this.enterEmail(email);
		await this.enterPassword(password);
		await this.clickLogin();
		await this.waitForNavigation();
	}

	/**
	 * Login as admin user
	 */
	async loginAsAdmin(): Promise<void> {
		await this.login("admin@gcmc-kaj.com", "AdminPassword123");
	}

	/**
	 * Login with test user credentials
	 */
	async loginAsTestUser(): Promise<void> {
		await this.login("admin@test.gcmc.com", "TestPassword123!");
	}

	/**
	 * Login with invalid credentials
	 */
	async loginWithInvalidCredentials(): Promise<void> {
		await this.login("invalid@example.com", "wrongpassword");
	}

	/**
	 * Submit empty login form
	 */
	async submitEmptyForm(): Promise<void> {
		await this.clickLogin();
	}

	/**
	 * Toggle password visibility
	 */
	async togglePasswordVisibility(): Promise<void> {
		const toggleExists = (await this.passwordToggle.count()) > 0;
		if (toggleExists) {
			await this.click(this.passwordToggle);
		}
	}

	/**
	 * Check remember me checkbox
	 */
	async checkRememberMe(): Promise<void> {
		const checkboxExists = (await this.rememberMeCheckbox.count()) > 0;
		if (checkboxExists) {
			await this.check(this.rememberMeCheckbox);
		}
	}

	/**
	 * Click forgot password link
	 */
	async clickForgotPassword(): Promise<void> {
		const linkExists = (await this.forgotPasswordLink.count()) > 0;
		if (linkExists) {
			await this.click(this.forgotPasswordLink);
			await this.waitForNavigation();
		}
	}

	// Verification Methods

	/**
	 * Verify login page is displayed correctly
	 */
	async verifyLoginPageDisplayed(): Promise<void> {
		await expect(this.page).toHaveURL(/\/login/);
		await this.verifyElementVisible(this.emailField);
		await this.verifyElementVisible(this.passwordField);
		await this.verifyElementVisible(this.loginButton);
	}

	/**
	 * Verify login form fields are empty
	 */
	async verifyFormFieldsEmpty(): Promise<void> {
		await expect(this.emailField).toHaveValue("");
		await expect(this.passwordField).toHaveValue("");
	}

	/**
	 * Verify login form fields have values
	 */
	async verifyFormFieldsHaveValues(
		email: string,
		password: string,
	): Promise<void> {
		await expect(this.emailField).toHaveValue(email);
		await expect(this.passwordField).toHaveValue(password);
	}

	/**
	 * Verify error message is displayed
	 */
	async verifyErrorMessageDisplayed(expectedMessage?: string): Promise<void> {
		await this.verifyElementVisible(this.errorMessage);
		if (expectedMessage) {
			await this.verifyElementText(this.errorMessage, expectedMessage);
		}
	}

	/**
	 * Verify validation message is displayed
	 */
	async verifyValidationMessageDisplayed(): Promise<void> {
		await this.verifyElementVisible(this.validationMessage);
	}

	/**
	 * Verify successful login redirect
	 */
	async verifySuccessfulLogin(): Promise<void> {
		// Wait for redirect away from login page
		await expect(this.page).not.toHaveURL(/\/login/);

		// Common redirect destinations after login
		const possibleUrls = [/\/dashboard/, /\/home/, /\/welcome/, /\/admin/];

		const currentUrl = await this.getCurrentUrl();
		const isValidRedirect = possibleUrls.some((pattern) =>
			pattern.test(currentUrl),
		);

		if (!isValidRedirect) {
			throw new Error(`Unexpected redirect URL after login: ${currentUrl}`);
		}
	}

	/**
	 * Verify user remains on login page (failed login)
	 */
	async verifyStillOnLoginPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/login/);
	}

	/**
	 * Verify password field type
	 */
	async verifyPasswordFieldType(
		expectedType: "password" | "text",
	): Promise<void> {
		await this.verifyElementAttribute(this.passwordField, "type", expectedType);
	}

	/**
	 * Verify remember me checkbox is checked
	 */
	async verifyRememberMeChecked(): Promise<void> {
		await expect(this.rememberMeCheckbox).toBeChecked();
	}

	/**
	 * Verify login button is enabled/disabled
	 */
	async verifyLoginButtonEnabled(enabled = true): Promise<void> {
		if (enabled) {
			await expect(this.loginButton).toBeEnabled();
		} else {
			await expect(this.loginButton).toBeDisabled();
		}
	}

	/**
	 * Verify page title
	 */
	async verifyPageTitle(expectedTitle?: string): Promise<void> {
		if (expectedTitle) {
			await this.verifyTitle(new RegExp(expectedTitle, "i"));
		} else {
			await this.verifyTitle(/login|sign in/i);
		}
	}

	/**
	 * Get current field values
	 */
	async getCurrentFieldValues(): Promise<{ email: string; password: string }> {
		const email = await this.emailField.inputValue();
		const password = await this.passwordField.inputValue();
		return { email, password };
	}

	/**
	 * Verify form accessibility
	 */
	async verifyFormAccessibility(): Promise<void> {
		// Check for proper labels
		await expect(this.emailField).toHaveAttribute("aria-label");
		await expect(this.passwordField).toHaveAttribute("aria-label");

		// Check for form structure
		await this.verifyElementVisible(this.loginForm);
	}

	/**
	 * Test keyboard navigation
	 */
	async testKeyboardNavigation(): Promise<void> {
		// Tab through form elements
		await this.pressKey("Tab");
		await expect(this.emailField).toBeFocused();

		await this.pressKey("Tab");
		await expect(this.passwordField).toBeFocused();

		await this.pressKey("Tab");
		await expect(this.loginButton).toBeFocused();
	}

	/**
	 * Submit form with Enter key
	 */
	async submitWithEnter(): Promise<void> {
		await this.passwordField.focus();
		await this.pressKey("Enter");
		await this.waitForNavigation();
	}
}
