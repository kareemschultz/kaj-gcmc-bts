import type { Page } from "@playwright/test";
import { allure } from "allure-playwright";

/**
 * TestZeus Hercules Integration
 *
 * Custom implementation of advanced testing capabilities
 * inspired by TestZeus Hercules framework
 */
export class TestHercules {
	private page: Page;
	private testMetrics: {
		startTime: number;
		endTime?: number;
		actions: Array<{
			type: string;
			timestamp: number;
			element?: string;
			duration?: number;
		}>;
		performance: {
			loadTime?: number;
			firstContentfulPaint?: number;
			domContentLoaded?: number;
		};
	};

	constructor(page: Page) {
		this.page = page;
		this.testMetrics = {
			startTime: Date.now(),
			actions: [],
			performance: {},
		};

		this.initializeMonitoring();
	}

	/**
	 * Initialize page monitoring
	 */
	private initializeMonitoring(): void {
		// Monitor network requests
		this.page.on("request", (request) => {
			this.testMetrics.actions.push({
				type: "request",
				timestamp: Date.now(),
				element: request.url(),
			});
		});

		// Monitor responses
		this.page.on("response", (response) => {
			this.testMetrics.actions.push({
				type: "response",
				timestamp: Date.now(),
				element: `${response.status()} ${response.url()}`,
			});
		});

		// Monitor console errors
		this.page.on("console", (msg) => {
			if (msg.type() === "error") {
				this.testMetrics.actions.push({
					type: "console_error",
					timestamp: Date.now(),
					element: msg.text(),
				});
			}
		});
	}

	/**
	 * Enhanced click with automatic retry and validation
	 */
	async smartClick(
		selector: string,
		options?: {
			timeout?: number;
			retries?: number;
			waitForNavigation?: boolean;
			screenshot?: boolean;
		},
	): Promise<void> {
		const {
			timeout = 10000,
			retries = 3,
			waitForNavigation = false,
			screenshot = false,
		} = options || {};

		const actionStart = Date.now();

		await allure.step(`Smart click on: ${selector}`, async () => {
			for (let attempt = 0; attempt < retries; attempt++) {
				try {
					const element = this.page.locator(selector);

					// Wait for element to be actionable
					await element.waitFor({ state: "visible", timeout });
					await element.scrollIntoViewIfNeeded();

					// Take screenshot before click if requested
					if (screenshot) {
						await this.captureScreenshot(
							`before-click-${selector.replace(/[^a-zA-Z0-9]/g, "-")}`,
						);
					}

					// Perform click
					await element.click({ timeout });

					// Wait for navigation if requested
					if (waitForNavigation) {
						await this.page.waitForLoadState("networkidle");
					}

					// Record successful action
					this.testMetrics.actions.push({
						type: "smart_click",
						timestamp: Date.now(),
						element: selector,
						duration: Date.now() - actionStart,
					});

					return; // Success, exit retry loop
				} catch (error) {
					if (attempt === retries - 1) {
						await this.captureScreenshot(
							`failed-click-${selector.replace(/[^a-zA-Z0-9]/g, "-")}`,
						);
						throw new Error(
							`Failed to click ${selector} after ${retries} attempts: ${error.message}`,
						);
					}
					await this.page.waitForTimeout(1000); // Wait before retry
				}
			}
		});
	}

	/**
	 * Enhanced form filling with validation
	 */
	async smartFillForm(
		formData: Record<string, string>,
		options?: {
			validate?: boolean;
			clearBefore?: boolean;
			submitAfter?: boolean;
		},
	): Promise<void> {
		const {
			validate = true,
			clearBefore = true,
			submitAfter = false,
		} = options || {};

		await allure.step("Smart form filling", async () => {
			for (const [field, value] of Object.entries(formData)) {
				const actionStart = Date.now();

				const fieldSelector = `[name="${field}"], #${field}, [data-testid="${field}"]`;
				const element = this.page.locator(fieldSelector);

				await element.waitFor({ state: "visible", timeout: 10000 });
				await element.scrollIntoViewIfNeeded();

				if (clearBefore) {
					await element.clear();
				}

				await element.fill(value);

				if (validate) {
					const actualValue = await element.inputValue();
					if (actualValue !== value) {
						throw new Error(
							`Form validation failed for ${field}: expected '${value}', got '${actualValue}'`,
						);
					}
				}

				this.testMetrics.actions.push({
					type: "form_fill",
					timestamp: Date.now(),
					element: field,
					duration: Date.now() - actionStart,
				});
			}

			if (submitAfter) {
				await this.smartClick('button[type="submit"], [data-testid="submit"]');
			}
		});
	}

	/**
	 * Smart wait with multiple conditions
	 */
	async smartWait(conditions: {
		selector?: string;
		url?: string | RegExp;
		text?: string;
		timeout?: number;
		networkIdle?: boolean;
	}): Promise<void> {
		const { timeout = 30000, networkIdle = false } = conditions;

		await allure.step("Smart wait for conditions", async () => {
			const promises: Promise<any>[] = [];

			if (conditions.selector) {
				promises.push(
					this.page.locator(conditions.selector).waitFor({ timeout }),
				);
			}

			if (conditions.url) {
				promises.push(this.page.waitForURL(conditions.url, { timeout }));
			}

			if (conditions.text) {
				promises.push(
					this.page.waitForSelector(`text=${conditions.text}`, { timeout }),
				);
			}

			if (networkIdle) {
				promises.push(this.page.waitForLoadState("networkidle", { timeout }));
			}

			await Promise.all(promises);
		});
	}

	/**
	 * Capture enhanced screenshot with metadata
	 */
	async captureScreenshot(
		name: string,
		options?: {
			fullPage?: boolean;
			highlight?: string[];
			annotations?: Array<{ x: number; y: number; text: string }>;
		},
	): Promise<void> {
		const { fullPage = true, highlight = [], annotations = [] } = options || {};

		await allure.step(`Capture screenshot: ${name}`, async () => {
			// Highlight elements if specified
			for (const selector of highlight) {
				await this.page.locator(selector).evaluate((el) => {
					el.style.border = "3px solid red";
					el.style.backgroundColor = "rgba(255, 255, 0, 0.3)";
				});
			}

			// Take screenshot
			const screenshotBuffer = await this.page.screenshot({
				fullPage,
				path: `test-results/screenshots/${name}-${Date.now()}.png`,
			});

			// Attach to Allure
			await allure.attachment(
				`Screenshot: ${name}`,
				screenshotBuffer,
				"image/png",
			);

			// Remove highlights
			for (const selector of highlight) {
				await this.page.locator(selector).evaluate((el) => {
					el.style.border = "";
					el.style.backgroundColor = "";
				});
			}
		});
	}

	/**
	 * Collect performance metrics
	 */
	async collectPerformanceMetrics(): Promise<void> {
		await allure.step("Collect performance metrics", async () => {
			const performanceMetrics = await this.page.evaluate(() => {
				const navigation = performance.getEntriesByType(
					"navigation",
				)[0] as PerformanceNavigationTiming;
				const paint = performance.getEntriesByType("paint");

				return {
					loadTime: navigation.loadEventEnd - navigation.navigationStart,
					domContentLoaded:
						navigation.domContentLoadedEventEnd - navigation.navigationStart,
					firstPaint:
						paint.find((entry) => entry.name === "first-paint")?.startTime || 0,
					firstContentfulPaint:
						paint.find((entry) => entry.name === "first-contentful-paint")
							?.startTime || 0,
					ttfb: navigation.responseStart - navigation.navigationStart,
				};
			});

			this.testMetrics.performance = performanceMetrics;

			// Attach performance data to Allure
			await allure.attachment(
				"Performance Metrics",
				JSON.stringify(performanceMetrics, null, 2),
				"application/json",
			);
		});
	}

	/**
	 * Validate accessibility
	 */
	async validateAccessibility(rules?: string[]): Promise<void> {
		await allure.step("Validate accessibility", async () => {
			try {
				// Inject axe-core if not already present
				await this.page.addScriptTag({
					url: "https://unpkg.com/axe-core@latest/axe.min.js",
				});

				const results = await this.page.evaluate((axeRules) => {
					return new Promise((resolve) => {
						window.axe.run(
							document,
							{
								rules: axeRules
									? axeRules.reduce((acc, rule) => {
											acc[rule] = { enabled: true };
											return acc;
										}, {})
									: undefined,
							},
							(err, results) => {
								if (err) throw err;
								resolve(results);
							},
						);
					});
				}, rules);

				// Attach accessibility report
				await allure.attachment(
					"Accessibility Report",
					JSON.stringify(results, null, 2),
					"application/json",
				);

				// Check for violations
				if (
					(results as any).violations &&
					(results as any).violations.length > 0
				) {
					const violationSummary = (results as any).violations
						.map((v: any) => `${v.id}: ${v.description}`)
						.join("\n");

					throw new Error(
						`Accessibility violations found:\n${violationSummary}`,
					);
				}
			} catch (error) {
				console.log("Accessibility validation failed:", error.message);
				throw error;
			}
		});
	}

	/**
	 * Smart element interaction with auto-detection
	 */
	async smartInteract(
		selector: string,
		action: "click" | "fill" | "select",
		value?: string,
	): Promise<void> {
		await allure.step(`Smart interact: ${action} on ${selector}`, async () => {
			const element = this.page.locator(selector);
			await element.waitFor({ state: "visible", timeout: 10000 });
			await element.scrollIntoViewIfNeeded();

			const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
			const inputType = await element.evaluate(
				(el) => el.getAttribute("type") || "",
			);

			switch (action) {
				case "click":
					if (
						["button", "a", "div"].includes(tagName) ||
						inputType === "button"
					) {
						await element.click();
					} else {
						throw new Error(`Cannot click on ${tagName} element`);
					}
					break;

				case "fill":
					if (["input", "textarea"].includes(tagName)) {
						await element.fill(value || "");
					} else {
						throw new Error(`Cannot fill ${tagName} element`);
					}
					break;

				case "select":
					if (tagName === "select") {
						await element.selectOption(value || "");
					} else {
						throw new Error(`Cannot select option on ${tagName} element`);
					}
					break;
			}
		});
	}

	/**
	 * Generate test report with metrics
	 */
	async generateTestReport(): Promise<void> {
		this.testMetrics.endTime = Date.now();

		const report = {
			testDuration: this.testMetrics.endTime - this.testMetrics.startTime,
			totalActions: this.testMetrics.actions.length,
			performance: this.testMetrics.performance,
			actionBreakdown: this.getActionBreakdown(),
			timeline: this.testMetrics.actions,
		};

		await allure.attachment(
			"Test Execution Report",
			JSON.stringify(report, null, 2),
			"application/json",
		);
	}

	/**
	 * Get action breakdown statistics
	 */
	private getActionBreakdown(): Record<string, number> {
		const breakdown: Record<string, number> = {};

		for (const action of this.testMetrics.actions) {
			breakdown[action.type] = (breakdown[action.type] || 0) + 1;
		}

		return breakdown;
	}

	/**
	 * Cleanup and finalize test
	 */
	async cleanup(): Promise<void> {
		await this.generateTestReport();
		await this.collectPerformanceMetrics();
	}
}

/**
 * Test execution wrapper with enhanced capabilities
 */
export class TestExecutor {
	private hercules: TestHercules;

	constructor(page: Page) {
		this.hercules = new TestHercules(page);
	}

	/**
	 * Execute test scenario with automatic error handling
	 */
	async executeScenario(scenario: {
		name: string;
		steps: Array<{
			description: string;
			action: () => Promise<void>;
			onError?: (error: Error) => Promise<void>;
		}>;
		cleanup?: () => Promise<void>;
	}): Promise<void> {
		await allure.epic("Test Execution");
		await allure.feature(scenario.name);

		try {
			for (const step of scenario.steps) {
				try {
					await allure.step(step.description, step.action);
				} catch (error) {
					await this.hercules.captureScreenshot(
						`error-${step.description.replace(/\s+/g, "-")}`,
					);

					if (step.onError) {
						await step.onError(error);
					} else {
						throw error;
					}
				}
			}
		} finally {
			if (scenario.cleanup) {
				await scenario.cleanup();
			}
			await this.hercules.cleanup();
		}
	}

	/**
	 * Get hercules instance for direct access
	 */
	getHercules(): TestHercules {
		return this.hercules;
	}
}
