import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Base Page Object Class
 *
 * Provides common functionality that all page objects inherit from.
 * Includes navigation, waiting, and verification methods.
 */
export abstract class BasePage {
	protected page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Navigate to a specific URL
	 */
	async goto(url: string): Promise<void> {
		await this.page.goto(url);
		await this.waitForPageLoad();
	}

	/**
	 * Wait for page to be fully loaded
	 */
	async waitForPageLoad(): Promise<void> {
		await this.page.waitForLoadState("networkidle");
		await this.page.waitForLoadState("domcontentloaded");
	}

	/**
	 * Get the current page URL
	 */
	async getCurrentUrl(): Promise<string> {
		return this.page.url();
	}

	/**
	 * Get the page title
	 */
	async getTitle(): Promise<string> {
		return this.page.title();
	}

	/**
	 * Click on an element
	 */
	async click(selector: string | Locator): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.click();
	}

	/**
	 * Fill a form field
	 */
	async fill(selector: string | Locator, value: string): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.fill(value);
	}

	/**
	 * Check if an element is visible
	 */
	async isVisible(selector: string | Locator): Promise<boolean> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		return await locator.isVisible();
	}

	/**
	 * Wait for an element to be visible
	 */
	async waitForElement(
		selector: string | Locator,
		options?: { timeout?: number },
	): Promise<Locator> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.waitFor({ state: "visible", ...options });
		return locator;
	}

	/**
	 * Get text content of an element
	 */
	async getText(selector: string | Locator): Promise<string> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		return (await locator.textContent()) || "";
	}

	/**
	 * Get attribute value of an element
	 */
	async getAttribute(
		selector: string | Locator,
		attribute: string,
	): Promise<string | null> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		return await locator.getAttribute(attribute);
	}

	/**
	 * Scroll element into view
	 */
	async scrollIntoView(selector: string | Locator): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.scrollIntoViewIfNeeded();
	}

	/**
	 * Take a screenshot
	 */
	async takeScreenshot(name: string): Promise<void> {
		await this.page.screenshot({
			path: `test-results/screenshots/${name}-${Date.now()}.png`,
			fullPage: true,
		});
	}

	/**
	 * Check for console errors
	 */
	async getConsoleErrors(): Promise<string[]> {
		const errors: string[] = [];
		this.page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text());
			}
		});
		return errors;
	}

	/**
	 * Wait for navigation to complete
	 */
	async waitForNavigation(): Promise<void> {
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Verify page URL matches expected pattern
	 */
	async verifyUrl(expectedUrl: string | RegExp): Promise<void> {
		if (typeof expectedUrl === "string") {
			await expect(this.page).toHaveURL(expectedUrl);
		} else {
			await expect(this.page).toHaveURL(expectedUrl);
		}
	}

	/**
	 * Verify page title
	 */
	async verifyTitle(expectedTitle: string | RegExp): Promise<void> {
		await expect(this.page).toHaveTitle(expectedTitle);
	}

	/**
	 * Verify element is visible
	 */
	async verifyElementVisible(selector: string | Locator): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await expect(locator).toBeVisible();
	}

	/**
	 * Verify element contains text
	 */
	async verifyElementText(
		selector: string | Locator,
		expectedText: string | RegExp,
	): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await expect(locator).toContainText(expectedText);
	}

	/**
	 * Verify element has attribute
	 */
	async verifyElementAttribute(
		selector: string | Locator,
		attribute: string,
		expectedValue: string,
	): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await expect(locator).toHaveAttribute(attribute, expectedValue);
	}

	/**
	 * Double click on an element
	 */
	async doubleClick(selector: string | Locator): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.dblclick();
	}

	/**
	 * Right click on an element
	 */
	async rightClick(selector: string | Locator): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.click({ button: "right" });
	}

	/**
	 * Hover over an element
	 */
	async hover(selector: string | Locator): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.hover();
	}

	/**
	 * Select option from dropdown
	 */
	async selectOption(
		selector: string | Locator,
		option: string,
	): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.selectOption(option);
	}

	/**
	 * Check a checkbox
	 */
	async check(selector: string | Locator): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.check();
	}

	/**
	 * Uncheck a checkbox
	 */
	async uncheck(selector: string | Locator): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.uncheck();
	}

	/**
	 * Upload file
	 */
	async uploadFile(
		selector: string | Locator,
		filePath: string,
	): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.setInputFiles(filePath);
	}

	/**
	 * Press key
	 */
	async pressKey(key: string): Promise<void> {
		await this.page.keyboard.press(key);
	}

	/**
	 * Type text
	 */
	async type(text: string, options?: { delay?: number }): Promise<void> {
		await this.page.keyboard.type(text, options);
	}

	/**
	 * Clear and fill input
	 */
	async clearAndFill(selector: string | Locator, value: string): Promise<void> {
		const locator =
			typeof selector === "string" ? this.page.locator(selector) : selector;
		await locator.clear();
		await locator.fill(value);
	}
}
