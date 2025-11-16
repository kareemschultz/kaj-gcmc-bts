import fs from "node:fs";
import path from "node:path";
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Screenshot Helper for E2E Tests
 *
 * Provides methods for taking and comparing screenshots for visual regression testing.
 */
export class ScreenshotHelper {
	constructor(private page: Page) {}

	/**
	 * Take a full-page screenshot
	 */
	async takeFullPage(name: string, options?: { mask?: Locator[] }) {
		await this.page.screenshot({
			path: `test-results/screenshots/${name}.png`,
			fullPage: true,
			mask: options?.mask,
		});
	}

	/**
	 * Take a viewport screenshot
	 */
	async takeViewport(name: string, options?: { mask?: Locator[] }) {
		await this.page.screenshot({
			path: `test-results/screenshots/${name}.png`,
			fullPage: false,
			mask: options?.mask,
		});
	}

	/**
	 * Take a screenshot of specific element
	 */
	async takeElement(selector: string, name: string) {
		const element = this.page.locator(selector);
		await element.screenshot({
			path: `test-results/screenshots/${name}.png`,
		});
	}

	/**
	 * Compare full-page screenshot with baseline
	 */
	async compareFullPage(name: string, options?: { mask?: Locator[] }) {
		// Wait for page to be stable
		await this.page.waitForLoadState("networkidle");

		// Take screenshot and compare
		await expect(this.page).toHaveScreenshot(`${name}.png`, {
			fullPage: true,
			mask: options?.mask,
			maxDiffPixels: 100,
		});
	}

	/**
	 * Compare viewport screenshot with baseline
	 */
	async compareViewport(name: string, options?: { mask?: Locator[] }) {
		// Wait for page to be stable
		await this.page.waitForLoadState("networkidle");

		// Take screenshot and compare
		await expect(this.page).toHaveScreenshot(`${name}.png`, {
			fullPage: false,
			mask: options?.mask,
			maxDiffPixels: 100,
		});
	}

	/**
	 * Compare element screenshot with baseline
	 */
	async compareElement(selector: string, name: string) {
		const element = this.page.locator(selector);
		await expect(element).toHaveScreenshot(`${name}.png`, {
			maxDiffPixels: 50,
		});
	}

	/**
	 * Mask dynamic elements before screenshot
	 * (e.g., dates, times, IDs)
	 */
	async maskDynamicElements(selectors: string[]): Promise<Locator[]> {
		return selectors.map((selector) => this.page.locator(selector));
	}

	/**
	 * Wait for images to load before screenshot
	 */
	async waitForImages() {
		await this.page.evaluate(() => {
			return Promise.all(
				Array.from(document.images)
					.filter((img) => !img.complete)
					.map(
						(img) =>
							new Promise((resolve) => {
								img.onload = img.onerror = resolve;
							}),
					),
			);
		});
	}

	/**
	 * Hide elements before screenshot
	 * (useful for hiding dynamic content)
	 */
	async hideElements(selectors: string[]) {
		for (const selector of selectors) {
			await this.page.locator(selector).evaluate((el) => {
				(el as HTMLElement).style.visibility = "hidden";
			});
		}
	}

	/**
	 * Create baseline directory if it doesn't exist
	 */
	private ensureBaselineDir() {
		const baselineDir = path.resolve(__dirname, "../snapshots");
		if (!fs.existsSync(baselineDir)) {
			fs.mkdirSync(baselineDir, { recursive: true });
		}
	}

	/**
	 * Update baseline screenshot
	 * (use with caution - only for intentional UI changes)
	 */
	async updateBaseline(name: string) {
		this.ensureBaselineDir();
		const snapshotPath = path.resolve(__dirname, `../snapshots/${name}.png`);

		await this.page.screenshot({
			path: snapshotPath,
			fullPage: true,
		});

		console.log(`✅ Updated baseline screenshot: ${name}.png`);
	}
}
