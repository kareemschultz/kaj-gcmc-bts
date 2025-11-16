import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

/**
 * Playwright E2E Test Configuration for GCMC Platform
 *
 * This configuration sets up comprehensive end-to-end testing with:
 * - Multi-browser testing (Chromium, Firefox, WebKit)
 * - Mobile viewport testing
 * - Screenshot and video recording
 * - Parallel execution
 * - Built-in test fixtures and helpers
 */
export default defineConfig({
	// Test directory
	testDir: "./tests/e2e",

	// Maximum time one test can run for
	timeout: 30 * 1000,

	// Test execution configuration
	expect: {
		// Maximum time expect() should wait for the condition to be met
		timeout: 5000,
		// Screenshot comparison tolerance
		toHaveScreenshot: { maxDiffPixels: 100 },
		toMatchSnapshot: { maxDiffPixelRatio: 0.01 },
	},

	// Run tests in files in parallel
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: !!process.env.CI,

	// Retry on CI only
	retries: process.env.CI ? 2 : 0,

	// Opt out of parallel tests on CI
	workers: process.env.CI ? 1 : undefined,

	// Reporter to use
	reporter: [
		["html", { outputFolder: "playwright-report", open: "never" }],
		["json", { outputFile: "playwright-report/results.json" }],
		["junit", { outputFile: "playwright-report/results.xml" }],
		["list"],
	],

	// Shared settings for all the projects below
	use: {
		// Base URL to use in actions like `await page.goto('/')`
		baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",

		// API URL for API testing
		extraHTTPHeaders: {
			// Add any default headers here
		},

		// Collect trace when retrying the failed test
		trace: "on-first-retry",

		// Screenshot on failure
		screenshot: "only-on-failure",

		// Video on first retry
		video: "retain-on-failure",

		// Browser context options
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: true,

		// Maximum time each action such as `click()` can take
		actionTimeout: 10000,

		// Name of the test
		locale: "en-US",
		timezoneId: "America/New_York",
	},

	// Configure projects for major browsers
	projects: [
		// Desktop browsers
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 720 },
			},
		},
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				viewport: { width: 1280, height: 720 },
			},
		},
		{
			name: "webkit",
			use: {
				...devices["Desktop Safari"],
				viewport: { width: 1280, height: 720 },
			},
		},

		// Mobile browsers
		{
			name: "mobile-chrome",
			use: {
				...devices["Pixel 5"],
			},
		},
		{
			name: "mobile-safari",
			use: {
				...devices["iPhone 13"],
			},
		},

		// Tablet
		{
			name: "tablet",
			use: {
				...devices["iPad Pro"],
			},
		},
	],

	// Run your local dev server before starting the tests
	webServer: {
		command: "bun run dev:web",
		url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000, // 2 minutes for server to start
		stdout: "ignore",
		stderr: "pipe",
	},

	// Global setup and teardown
	globalSetup: "./tests/fixtures/global-setup.ts",
	globalTeardown: "./tests/fixtures/global-teardown.ts",

	// Output folder for test artifacts
	outputDir: "test-results/",

	// Folder for test artifacts such as screenshots, videos, traces, etc.
	snapshotDir: "tests/snapshots",
	snapshotPathTemplate:
		"{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}",
});
