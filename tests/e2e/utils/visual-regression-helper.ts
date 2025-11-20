import type { Page, Locator, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";
import * as pixelmatch from "pixelmatch";
import * as sharp from "sharp";
import * as fs from "node:fs";
import * as path from "node:path";
import { AllureHelper } from "./allure-helpers";

/**
 * Visual Regression Testing Utilities
 *
 * Provides comprehensive visual testing capabilities including:
 * - Full page screenshots
 * - Element-specific screenshots
 * - Cross-browser visual comparisons
 * - Mobile vs desktop comparisons
 * - Pixel-level diff detection
 * - Threshold-based matching
 * - Before/after comparisons
 * - Visual test reporting
 */

export interface VisualTestOptions {
	threshold?: number; // 0-1, where 0 is exact match
	maxDiffPixels?: number;
	fullPage?: boolean;
	clip?: { x: number; y: number; width: number; height: number };
	mask?: Locator[];
	animations?: 'disabled' | 'allow';
	caret?: 'hide' | 'initial';
	scale?: 'css' | 'device';
	timeout?: number;
}

export interface VisualComparisonResult {
	passed: boolean;
	diffPixels: number;
	totalPixels: number;
	diffPercentage: number;
	diffImagePath?: string;
	baselineImagePath: string;
	actualImagePath: string;
}

export class VisualRegressionHelper {
	private page: Page;
	private testInfo: TestInfo;
	private baselinePath: string;
	private actualPath: string;
	private diffPath: string;

	constructor(page: Page, testInfo: TestInfo) {
		this.page = page;
		this.testInfo = testInfo;

		// Set up directory paths
		const testName = testInfo.title.replace(/[^a-zA-Z0-9]/g, '_');
		const browserName = testInfo.project.name;

		this.baselinePath = path.join('tests', 'visual', 'baseline', browserName, `${testName}`);
		this.actualPath = path.join('test-results', 'visual', 'actual', browserName, `${testName}`);
		this.diffPath = path.join('test-results', 'visual', 'diff', browserName, `${testName}`);

		// Ensure directories exist
		this.ensureDirectories();
	}

	/**
	 * Take a visual snapshot of the entire page
	 */
	async expectPageToMatchSnapshot(
		name: string,
		options?: VisualTestOptions
	): Promise<VisualComparisonResult> {
		await this.waitForStableContent();

		const snapshotOptions = {
			fullPage: options?.fullPage ?? true,
			animations: options?.animations ?? 'disabled',
			caret: options?.caret ?? 'hide',
			scale: options?.scale ?? 'css',
			timeout: options?.timeout ?? 30000,
			threshold: options?.threshold ?? 0.2,
			maxDiffPixels: options?.maxDiffPixels ?? 100,
			...options
		};

		const screenshotPath = path.join(this.actualPath, `${name}.png`);
		await this.page.screenshot({
			path: screenshotPath,
			fullPage: snapshotOptions.fullPage,
			animations: snapshotOptions.animations,
			caret: snapshotOptions.caret,
			scale: snapshotOptions.scale,
			timeout: snapshotOptions.timeout,
			clip: snapshotOptions.clip,
			mask: snapshotOptions.mask
		});

		return await this.compareImages(name, snapshotOptions);
	}

	/**
	 * Take a visual snapshot of a specific element
	 */
	async expectElementToMatchSnapshot(
		element: Locator,
		name: string,
		options?: Omit<VisualTestOptions, 'fullPage'>
	): Promise<VisualComparisonResult> {
		await this.waitForStableContent();
		await element.waitFor({ state: 'visible' });

		const snapshotOptions = {
			animations: options?.animations ?? 'disabled',
			caret: options?.caret ?? 'hide',
			scale: options?.scale ?? 'css',
			timeout: options?.timeout ?? 30000,
			threshold: options?.threshold ?? 0.2,
			maxDiffPixels: options?.maxDiffPixels ?? 100,
			...options
		};

		const screenshotPath = path.join(this.actualPath, `${name}_element.png`);
		await element.screenshot({
			path: screenshotPath,
			animations: snapshotOptions.animations,
			caret: snapshotOptions.caret,
			scale: snapshotOptions.scale,
			timeout: snapshotOptions.timeout
		});

		return await this.compareImages(`${name}_element`, snapshotOptions);
	}

	/**
	 * Take responsive screenshots across different viewports
	 */
	async expectResponsiveSnapshots(
		name: string,
		viewports: { name: string; width: number; height: number }[],
		options?: VisualTestOptions
	): Promise<VisualComparisonResult[]> {
		const results: VisualComparisonResult[] = [];

		for (const viewport of viewports) {
			await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
			await this.waitForStableContent();

			const result = await this.expectPageToMatchSnapshot(
				`${name}_${viewport.name}`,
				options
			);
			results.push(result);
		}

		return results;
	}

	/**
	 * Test visual differences after an action
	 */
	async expectVisualChangeAfterAction(
		name: string,
		action: () => Promise<void>,
		options?: VisualTestOptions & { detectChange?: boolean }
	): Promise<{
		before: VisualComparisonResult;
		after: VisualComparisonResult;
		changeDetected: boolean;
	}> {
		// Take before screenshot
		const beforeResult = await this.expectPageToMatchSnapshot(`${name}_before`, options);

		// Perform action
		await action();
		await this.waitForStableContent();

		// Take after screenshot
		const afterResult = await this.expectPageToMatchSnapshot(`${name}_after`, options);

		// Compare before and after
		const changeDetected = options?.detectChange
			? await this.detectVisualChange(`${name}_before`, `${name}_after`)
			: false;

		return {
			before: beforeResult,
			after: afterResult,
			changeDetected
		};
	}

	/**
	 * Test visual consistency across different states
	 */
	async expectConsistentStateSnapshots(
		name: string,
		states: { name: string; setup: () => Promise<void> }[],
		options?: VisualTestOptions
	): Promise<{ [stateName: string]: VisualComparisonResult }> {
		const results: { [stateName: string]: VisualComparisonResult } = {};

		for (const state of states) {
			await state.setup();
			await this.waitForStableContent();

			const result = await this.expectPageToMatchSnapshot(
				`${name}_${state.name}`,
				options
			);
			results[state.name] = result;
		}

		return results;
	}

	/**
	 * Take a visual snapshot with animation frames
	 */
	async expectAnimationSequence(
		name: string,
		triggerAnimation: () => Promise<void>,
		options?: VisualTestOptions & {
			frameCount?: number;
			frameInterval?: number;
		}
	): Promise<VisualComparisonResult[]> {
		const frameCount = options?.frameCount ?? 5;
		const frameInterval = options?.frameInterval ?? 200;
		const results: VisualComparisonResult[] = [];

		// Trigger animation
		await triggerAnimation();

		// Capture frames
		for (let i = 0; i < frameCount; i++) {
			await this.page.waitForTimeout(frameInterval);
			const result = await this.expectPageToMatchSnapshot(
				`${name}_frame_${i}`,
				{ ...options, animations: 'allow' }
			);
			results.push(result);
		}

		return results;
	}

	/**
	 * Private method to compare images
	 */
	private async compareImages(
		name: string,
		options: VisualTestOptions
	): Promise<VisualComparisonResult> {
		const baselinePath = path.join(this.baselinePath, `${name}.png`);
		const actualPath = path.join(this.actualPath, `${name}.png`);
		const diffPath = path.join(this.diffPath, `${name}_diff.png`);

		// If no baseline exists, create one and pass the test
		if (!fs.existsSync(baselinePath)) {
			await this.ensureDirectoryExists(path.dirname(baselinePath));
			fs.copyFileSync(actualPath, baselinePath);

			await AllureHelper.attachTestData('Visual Test - New Baseline', {
				name,
				message: 'No baseline found, created new baseline image',
				baselinePath,
				actualPath
			});

			return {
				passed: true,
				diffPixels: 0,
				totalPixels: 0,
				diffPercentage: 0,
				baselineImagePath: baselinePath,
				actualImagePath: actualPath
			};
		}

		// Load images for comparison
		const baselineBuffer = fs.readFileSync(baselinePath);
		const actualBuffer = fs.readFileSync(actualPath);

		// Get image dimensions and data
		const baselineImage = sharp(baselineBuffer);
		const actualImage = sharp(actualBuffer);

		const baselineData = await baselineImage.raw().toBuffer();
		const actualData = await actualImage.raw().toBuffer();

		const { width, height } = await baselineImage.metadata();
		const totalPixels = (width ?? 0) * (height ?? 0);

		// Ensure dimensions match
		const actualMetadata = await actualImage.metadata();
		if (width !== actualMetadata.width || height !== actualMetadata.height) {
			throw new Error(
				`Image dimensions don't match: baseline(${width}x${height}) vs actual(${actualMetadata.width}x${actualMetadata.height})`
			);
		}

		// Create diff image buffer
		const diffBuffer = Buffer.alloc(baselineData.length);

		// Compare images using pixelmatch
		const diffPixels = pixelmatch(
			baselineData,
			actualData,
			diffBuffer,
			width ?? 0,
			height ?? 0,
			{
				threshold: options.threshold ?? 0.1,
				alpha: 0.1,
				includeAA: false
			}
		);

		const diffPercentage = (diffPixels / totalPixels) * 100;
		const passed = diffPixels <= (options.maxDiffPixels ?? 0) ||
			diffPercentage <= ((options.threshold ?? 0.1) * 100);

		// Save diff image if there are differences
		if (diffPixels > 0) {
			await this.ensureDirectoryExists(path.dirname(diffPath));
			await sharp(diffBuffer, {
				raw: { width: width ?? 0, height: height ?? 0, channels: 4 }
			}).png().toFile(diffPath);
		}

		// Attach results to Allure report
		await this.attachVisualTestResults(name, {
			passed,
			diffPixels,
			totalPixels,
			diffPercentage,
			diffImagePath: diffPixels > 0 ? diffPath : undefined,
			baselineImagePath: baselinePath,
			actualImagePath: actualPath
		});

		return {
			passed,
			diffPixels,
			totalPixels,
			diffPercentage,
			diffImagePath: diffPixels > 0 ? diffPath : undefined,
			baselineImagePath: baselinePath,
			actualImagePath: actualPath
		};
	}

	/**
	 * Detect visual change between two screenshots
	 */
	private async detectVisualChange(beforeName: string, afterName: string): Promise<boolean> {
		const beforePath = path.join(this.actualPath, `${beforeName}.png`);
		const afterPath = path.join(this.actualPath, `${afterName}.png`);

		if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
			return false;
		}

		const beforeBuffer = fs.readFileSync(beforePath);
		const afterBuffer = fs.readFileSync(afterPath);

		// Quick comparison using buffer
		return !beforeBuffer.equals(afterBuffer);
	}

	/**
	 * Wait for stable content (no animations, loading, etc.)
	 */
	private async waitForStableContent(): Promise<void> {
		// Wait for any pending network requests
		await this.page.waitForLoadState('networkidle');

		// Wait for any pending animations to complete
		await this.page.waitForFunction(
			() => {
				// Check for running animations
				const animations = document.getAnimations();
				return animations.every(animation => animation.playState === 'finished');
			},
			{ timeout: 5000 }
		).catch(() => {
			// Ignore timeout - animations might be intentionally infinite
		});

		// Additional wait for stability
		await this.page.waitForTimeout(500);
	}

	/**
	 * Ensure directory exists
	 */
	private async ensureDirectoryExists(dirPath: string): Promise<void> {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
		}
	}

	/**
	 * Ensure all required directories exist
	 */
	private ensureDirectories(): void {
		[this.baselinePath, this.actualPath, this.diffPath].forEach(dir => {
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
		});
	}

	/**
	 * Attach visual test results to Allure report
	 */
	private async attachVisualTestResults(
		name: string,
		result: VisualComparisonResult
	): Promise<void> {
		// Attach comparison summary
		await AllureHelper.attachTestData(`Visual Test - ${name}`, {
			testName: name,
			passed: result.passed,
			diffPixels: result.diffPixels,
			totalPixels: result.totalPixels,
			diffPercentage: result.diffPercentage.toFixed(2) + '%'
		});

		// Attach images
		if (fs.existsSync(result.baselineImagePath)) {
			const baselineBuffer = fs.readFileSync(result.baselineImagePath);
			await AllureHelper.attachTestData(
				`${name} - Baseline Image`,
				baselineBuffer,
				'image/png'
			);
		}

		const actualBuffer = fs.readFileSync(result.actualImagePath);
		await AllureHelper.attachTestData(`${name} - Actual Image`, actualBuffer, 'image/png');

		if (result.diffImagePath && fs.existsSync(result.diffImagePath)) {
			const diffBuffer = fs.readFileSync(result.diffImagePath);
			await AllureHelper.attachTestData(`${name} - Diff Image`, diffBuffer, 'image/png');
		}
	}

	/**
	 * Update baseline image (for approved changes)
	 */
	async updateBaseline(name: string): Promise<void> {
		const actualPath = path.join(this.actualPath, `${name}.png`);
		const baselinePath = path.join(this.baselinePath, `${name}.png`);

		if (fs.existsSync(actualPath)) {
			await this.ensureDirectoryExists(path.dirname(baselinePath));
			fs.copyFileSync(actualPath, baselinePath);
		}
	}

	/**
	 * Clean up visual test artifacts
	 */
	cleanupTestArtifacts(): void {
		// Remove actual and diff images for passed tests
		if (fs.existsSync(this.actualPath)) {
			fs.rmSync(this.actualPath, { recursive: true, force: true });
		}
		if (fs.existsSync(this.diffPath)) {
			fs.rmSync(this.diffPath, { recursive: true, force: true });
		}
	}
}