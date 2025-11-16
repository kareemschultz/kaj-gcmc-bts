import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { NodeResult, Result } from "axe-core";

/**
 * Accessibility Helper for E2E Tests
 *
 * Provides methods for automated accessibility testing using axe-core.
 */
export class AccessibilityHelper {
	constructor(private page: Page) {}

	/**
	 * Run full accessibility scan on current page
	 */
	async scanPage(options?: {
		disableRules?: string[];
		tags?: string[];
	}): Promise<void> {
		const axeBuilder = new AxeBuilder({ page: this.page });

		// Disable specific rules if needed
		if (options?.disableRules) {
			axeBuilder.disableRules(options.disableRules);
		}

		// Filter by WCAG tags if specified
		if (options?.tags) {
			axeBuilder.withTags(options.tags);
		}

		// Run the scan
		const results = await axeBuilder.analyze();

		// Assert no violations
		expect(
			results.violations,
			this.formatViolations(results.violations),
		).toEqual([]);
	}

	/**
	 * Run WCAG 2.1 Level A compliance scan
	 */
	async scanWCAG_A() {
		await this.scanPage({ tags: ["wcag2a", "wcag21a"] });
	}

	/**
	 * Run WCAG 2.1 Level AA compliance scan
	 */
	async scanWCAG_AA() {
		await this.scanPage({ tags: ["wcag2aa", "wcag21aa"] });
	}

	/**
	 * Run WCAG 2.1 Level AAA compliance scan
	 */
	async scanWCAG_AAA() {
		await this.scanPage({ tags: ["wcag2aaa", "wcag21aaa"] });
	}

	/**
	 * Scan specific element for accessibility issues
	 */
	async scanElement(selector: string): Promise<void> {
		const axeBuilder = new AxeBuilder({ page: this.page }).include(selector);

		const results = await axeBuilder.analyze();

		expect(
			results.violations,
			this.formatViolations(results.violations),
		).toEqual([]);
	}

	/**
	 * Check keyboard navigation
	 */
	async testKeyboardNavigation(expectedOrder: string[]) {
		for (const selector of expectedOrder) {
			await this.page.keyboard.press("Tab");
			const focused = await this.page.locator(selector);
			await expect(focused).toBeFocused();
		}
	}

	/**
	 * Check focus visible on interactive elements
	 */
	async testFocusVisible(selector: string) {
		const element = this.page.locator(selector);
		await element.focus();

		// Check if focus is visible (outline or other indicator)
		const outlineWidth = await element.evaluate((el) => {
			return window.getComputedStyle(el).outlineWidth;
		});

		expect(outlineWidth).not.toBe("0px");
	}

	/**
	 * Check color contrast ratios
	 */
	async testColorContrast() {
		await this.scanPage({ tags: ["cat.color"] });
	}

	/**
	 * Check alt text on images
	 */
	async testImageAltText() {
		const images = await this.page.locator("img").all();

		for (const img of images) {
			const alt = await img.getAttribute("alt");
			const role = await img.getAttribute("role");

			// Images should have alt text or role="presentation"
			expect(
				alt !== null || role === "presentation",
				"Image should have alt text or role='presentation'",
			).toBeTruthy();
		}
	}

	/**
	 * Check ARIA labels on interactive elements
	 */
	async testAriaLabels(selector: string) {
		const element = this.page.locator(selector);
		const ariaLabel =
			(await element.getAttribute("aria-label")) ||
			(await element.getAttribute("aria-labelledby"));

		expect(
			ariaLabel,
			`Element ${selector} should have aria-label or aria-labelledby`,
		).toBeTruthy();
	}

	/**
	 * Check semantic HTML structure
	 */
	async testSemanticHTML() {
		// Check for main landmark
		const main = this.page.locator("main");
		await expect(main).toBeVisible();

		// Check for proper heading hierarchy
		const headings = await this.page.locator("h1, h2, h3, h4, h5, h6").all();
		expect(
			headings.length,
			"Page should have semantic headings",
		).toBeGreaterThan(0);
	}

	/**
	 * Check form labels
	 */
	async testFormLabels() {
		const inputs = await this.page
			.locator('input:not([type="hidden"]), select, textarea')
			.all();

		for (const input of inputs) {
			const id = await input.getAttribute("id");
			const ariaLabel = await input.getAttribute("aria-label");
			const ariaLabelledby = await input.getAttribute("aria-labelledby");

			// Check if input has associated label
			let hasLabel = false;
			if (id) {
				const label = await this.page.locator(`label[for="${id}"]`).count();
				hasLabel = label > 0;
			}

			expect(
				hasLabel || ariaLabel || ariaLabelledby,
				"Form input should have associated label or aria-label",
			).toBeTruthy();
		}
	}

	/**
	 * Test screen reader announcements
	 */
	async testAriaLive(selector: string, expectedRole: "polite" | "assertive") {
		const element = this.page.locator(selector);
		const ariaLive = await element.getAttribute("aria-live");

		expect(ariaLive).toBe(expectedRole);
	}

	/**
	 * Format violations for better error messages
	 */
	private formatViolations(violations: Result[]): string {
		if (violations.length === 0) return "";

		return violations
			.map((violation) => {
				return `
[${violation.id}] ${violation.help}
  Impact: ${violation.impact}
  Description: ${violation.description}
  Affected elements: ${violation.nodes.length}
  ${violation.nodes.map((node: NodeResult) => `    - ${node.target}`).join("\n")}
`;
			})
			.join("\n");
	}

	/**
	 * Generate accessibility report
	 */
	async generateReport(name: string): Promise<void> {
		const axeBuilder = new AxeBuilder({ page: this.page });
		const results = await axeBuilder.analyze();

		// Save report to file
		const reportPath = `test-results/a11y-reports/${name}.json`;
		const fs = await import("node:fs");
		const path = await import("node:path");

		const dir = path.dirname(reportPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

		console.log(`✅ Accessibility report saved: ${reportPath}`);
		console.log(`Violations: ${results.violations.length}`);
		console.log(`Passes: ${results.passes.length}`);
		console.log(`Incomplete: ${results.incomplete.length}`);
	}
}
