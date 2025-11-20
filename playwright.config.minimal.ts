import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
	testDir: "./tests/e2e",
	timeout: 30 * 1000,

	expect: {
		timeout: 5000,
		toHaveScreenshot: { maxDiffPixels: 100 },
		toMatchSnapshot: { maxDiffPixelRatio: 0.01 },
	},

	fullyParallel: false,
	retries: 0,
	workers: 1,

	reporter: [
		["list"],
		["json", { outputFile: "playwright-report/results.json" }],
	],

	use: {
		baseURL: "http://localhost:3001",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: true,
		actionTimeout: 10000,
		locale: "en-US",
		timezoneId: "America/New_York",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	outputDir: "test-results/",
});