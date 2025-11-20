import type { Page, TestInfo } from "@playwright/test";
import { allure } from "allure-playwright";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Enhanced Allure Reporting Utilities
 *
 * Provides comprehensive reporting capabilities including:
 * - Step annotations with detailed logging
 * - Screenshot and video attachments
 * - Console logs and network activity
 * - Performance metrics
 * - Test data attachments
 * - Environment information
 */

export class AllureHelper {
	private page: Page;
	private testInfo: TestInfo;

	constructor(page: Page, testInfo: TestInfo) {
		this.page = page;
		this.testInfo = testInfo;
	}

	/**
	 * Create a test step with automatic screenshot on failure
	 */
	static async step<T>(
		name: string,
		body: () => Promise<T>,
		options?: {
			page?: Page;
			testInfo?: TestInfo;
			attachScreenshot?: boolean;
			severity?: 'critical' | 'normal' | 'minor' | 'trivial';
		}
	): Promise<T> {
		return await allure.step(name, async () => {
			try {
				const result = await body();

				// Attach success screenshot if requested
				if (options?.attachScreenshot && options?.page) {
					await AllureHelper.attachScreenshot(
						options.page,
						`${name} - Success`,
						'image/png'
					);
				}

				return result;
			} catch (error) {
				// Attach failure screenshot
				if (options?.page) {
					await AllureHelper.attachScreenshot(
						options.page,
						`${name} - Failure`,
						'image/png'
					);

					// Attach console logs
					await AllureHelper.attachConsoleLogs(options.page);

					// Attach page HTML for debugging
					await AllureHelper.attachPageSource(options.page);
				}

				throw error;
			}
		});
	}

	/**
	 * Attach screenshot to Allure report
	 */
	static async attachScreenshot(
		page: Page,
		name: string,
		type: 'image/png' | 'image/jpeg' = 'image/png'
	): Promise<void> {
		try {
			const screenshot = await page.screenshot({
				fullPage: true,
				type: type === 'image/jpeg' ? 'jpeg' : 'png'
			});

			await allure.attachment(name, screenshot, type);
		} catch (error) {
			console.warn(`Failed to attach screenshot: ${error}`);
		}
	}

	/**
	 * Attach console logs to Allure report
	 */
	static async attachConsoleLogs(page: Page): Promise<void> {
		try {
			const logs: string[] = [];

			// Capture console messages
			page.on('console', (msg) => {
				logs.push(`${msg.type()}: ${msg.text()}`);
			});

			// Wait a moment to collect logs
			await page.waitForTimeout(1000);

			if (logs.length > 0) {
				await allure.attachment(
					'Console Logs',
					logs.join('\n'),
					'text/plain'
				);
			}
		} catch (error) {
			console.warn(`Failed to attach console logs: ${error}`);
		}
	}

	/**
	 * Attach page source HTML to Allure report
	 */
	static async attachPageSource(page: Page): Promise<void> {
		try {
			const content = await page.content();
			await allure.attachment('Page Source', content, 'text/html');
		} catch (error) {
			console.warn(`Failed to attach page source: ${error}`);
		}
	}

	/**
	 * Attach network requests to Allure report
	 */
	static async attachNetworkActivity(
		page: Page,
		filterPattern?: RegExp
	): Promise<void> {
		try {
			const requests: any[] = [];

			page.on('request', (request) => {
				if (!filterPattern || filterPattern.test(request.url())) {
					requests.push({
						url: request.url(),
						method: request.method(),
						headers: request.headers(),
						postData: request.postData()
					});
				}
			});

			page.on('response', (response) => {
				const request = requests.find(r => r.url === response.url());
				if (request) {
					request.status = response.status();
					request.statusText = response.statusText();
					request.responseHeaders = response.headers();
				}
			});

			// Wait to collect network activity
			await page.waitForTimeout(2000);

			if (requests.length > 0) {
				await allure.attachment(
					'Network Activity',
					JSON.stringify(requests, null, 2),
					'application/json'
				);
			}
		} catch (error) {
			console.warn(`Failed to attach network activity: ${error}`);
		}
	}

	/**
	 * Attach performance metrics to Allure report
	 */
	static async attachPerformanceMetrics(page: Page): Promise<void> {
		try {
			const metrics = await page.evaluate(() => {
				const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
				return {
					domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
					loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
					firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
					firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0,
					navigationStart: navigation.navigationStart,
					responseEnd: navigation.responseEnd,
					domInteractive: navigation.domInteractive
				};
			});

			await allure.attachment(
				'Performance Metrics',
				JSON.stringify(metrics, null, 2),
				'application/json'
			);
		} catch (error) {
			console.warn(`Failed to attach performance metrics: ${error}`);
		}
	}

	/**
	 * Attach test data to Allure report
	 */
	static async attachTestData(
		name: string,
		data: any,
		type: 'application/json' | 'text/plain' | 'text/csv' = 'application/json'
	): Promise<void> {
		try {
			const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
			await allure.attachment(name, content, type);
		} catch (error) {
			console.warn(`Failed to attach test data: ${error}`);
		}
	}

	/**
	 * Attach environment information to Allure report
	 */
	static async attachEnvironmentInfo(): Promise<void> {
		try {
			const envInfo = {
				platform: process.platform,
				nodeVersion: process.version,
				timestamp: new Date().toISOString(),
				baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
				environment: process.env.NODE_ENV || 'test',
				browser: 'Playwright',
				viewport: '1280x720'
			};

			await allure.attachment(
				'Environment Information',
				JSON.stringify(envInfo, null, 2),
				'application/json'
			);
		} catch (error) {
			console.warn(`Failed to attach environment info: ${error}`);
		}
	}

	/**
	 * Attach browser logs to Allure report
	 */
	static async attachBrowserLogs(page: Page): Promise<void> {
		try {
			const logs = await page.evaluate(() => {
				// Get browser console logs
				const consoleLogs = (window as any).__consoleLogs || [];

				// Get JavaScript errors
				const errors = (window as any).__jsErrors || [];

				return {
					console: consoleLogs,
					errors: errors
				};
			});

			await allure.attachment(
				'Browser Logs',
				JSON.stringify(logs, null, 2),
				'application/json'
			);
		} catch (error) {
			console.warn(`Failed to attach browser logs: ${error}`);
		}
	}

	/**
	 * Attach video recording to Allure report (if available)
	 */
	static async attachVideo(testInfo: TestInfo): Promise<void> {
		try {
			const videoPath = await testInfo.attach('video', {
				path: testInfo.outputPath('video.webm'),
			});

			if (videoPath && fs.existsSync(videoPath)) {
				const videoBuffer = fs.readFileSync(videoPath);
				await allure.attachment('Test Video', videoBuffer, 'video/webm');
			}
		} catch (error) {
			console.warn(`Failed to attach video: ${error}`);
		}
	}

	/**
	 * Attach trace to Allure report (if available)
	 */
	static async attachTrace(testInfo: TestInfo): Promise<void> {
		try {
			const tracePath = testInfo.outputPath('trace.zip');

			if (fs.existsSync(tracePath)) {
				const traceBuffer = fs.readFileSync(tracePath);
				await allure.attachment('Playwright Trace', traceBuffer, 'application/zip');
			}
		} catch (error) {
			console.warn(`Failed to attach trace: ${error}`);
		}
	}

	/**
	 * Add test step with context
	 */
	static async stepWithContext<T>(
		name: string,
		body: () => Promise<T>,
		context: {
			page: Page;
			testInfo: TestInfo;
			severity?: 'critical' | 'normal' | 'minor' | 'trivial';
			description?: string;
		}
	): Promise<T> {
		return await allure.step(name, async () => {
			// Add step description if provided
			if (context.description) {
				await allure.description(context.description);
			}

			// Add severity if provided
			if (context.severity) {
				await allure.severity(context.severity);
			}

			try {
				const result = await body();

				// Attach success information
				await AllureHelper.attachScreenshot(context.page, `${name} - Success`);

				return result;
			} catch (error) {
				// Comprehensive failure attachments
				await AllureHelper.attachScreenshot(context.page, `${name} - Failure`);
				await AllureHelper.attachConsoleLogs(context.page);
				await AllureHelper.attachPageSource(context.page);
				await AllureHelper.attachPerformanceMetrics(context.page);
				await AllureHelper.attachNetworkActivity(context.page);

				throw error;
			}
		});
	}

	/**
	 * Add custom labels to test
	 */
	static async addLabels(labels: {
		feature?: string;
		story?: string;
		owner?: string;
		severity?: 'critical' | 'normal' | 'minor' | 'trivial';
		tag?: string[];
	}): Promise<void> {
		if (labels.feature) await allure.feature(labels.feature);
		if (labels.story) await allure.story(labels.story);
		if (labels.owner) await allure.owner(labels.owner);
		if (labels.severity) await allure.severity(labels.severity);
		if (labels.tag) {
			for (const tag of labels.tag) {
				await allure.tag(tag);
			}
		}
	}

	/**
	 * Add test links (requirements, issues, etc.)
	 */
	static async addLinks(links: {
		tms?: string; // Test Management System link
		issue?: string; // Issue tracker link
		custom?: { name: string; url: string }[];
	}): Promise<void> {
		if (links.tms) await allure.tms(links.tms, links.tms);
		if (links.issue) await allure.issue(links.issue, links.issue);
		if (links.custom) {
			for (const link of links.custom) {
				await allure.link(link.url, link.name);
			}
		}
	}

	/**
	 * Create comprehensive test report on failure
	 */
	static async createFailureReport(
		page: Page,
		testInfo: TestInfo,
		error: Error
	): Promise<void> {
		await allure.step('Collecting failure information', async () => {
			// Attach error details
			await AllureHelper.attachTestData('Error Details', {
				message: error.message,
				stack: error.stack,
				name: error.name
			});

			// Attach comprehensive page state
			await AllureHelper.attachScreenshot(page, 'Failure Screenshot');
			await AllureHelper.attachPageSource(page);
			await AllureHelper.attachConsoleLogs(page);
			await AllureHelper.attachBrowserLogs(page);
			await AllureHelper.attachNetworkActivity(page);
			await AllureHelper.attachPerformanceMetrics(page);
			await AllureHelper.attachEnvironmentInfo();

			// Attach video and trace if available
			await AllureHelper.attachVideo(testInfo);
			await AllureHelper.attachTrace(testInfo);

			// Attach current URL and user agent
			await AllureHelper.attachTestData('Page Information', {
				url: page.url(),
				title: await page.title(),
				userAgent: await page.evaluate(() => navigator.userAgent),
				viewport: await page.viewportSize(),
				cookies: await page.context().cookies()
			});
		});
	}
}

/**
 * Decorator for automatic Allure step reporting
 */
export function AllureStep(stepName?: string) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;
		const name = stepName || `${target.constructor.name}.${propertyKey}`;

		descriptor.value = async function (...args: any[]) {
			return await allure.step(name, async () => {
				return await originalMethod.apply(this, args);
			});
		};

		return descriptor;
	};
}

/**
 * Helper function for API call steps
 */
export async function apiStep<T>(
	name: string,
	apiCall: () => Promise<T>,
	options?: {
		attachRequest?: boolean;
		attachResponse?: boolean;
	}
): Promise<T> {
	return await allure.step(`API: ${name}`, async () => {
		try {
			const result = await apiCall();

			if (options?.attachResponse) {
				await AllureHelper.attachTestData('API Response', result);
			}

			return result;
		} catch (error) {
			await AllureHelper.attachTestData('API Error', {
				error: error.message,
				stack: error.stack
			});
			throw error;
		}
	});
}

/**
 * Helper function for database operation steps
 */
export async function dbStep<T>(
	name: string,
	dbOperation: () => Promise<T>
): Promise<T> {
	return await allure.step(`DB: ${name}`, async () => {
		try {
			const result = await dbOperation();
			await AllureHelper.attachTestData('DB Result', result);
			return result;
		} catch (error) {
			await AllureHelper.attachTestData('DB Error', {
				error: error.message,
				operation: name
			});
			throw error;
		}
	});
}