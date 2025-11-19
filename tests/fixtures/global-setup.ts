import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type FullConfig } from "@playwright/test";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Check if the web server is available and healthy
 * Uses the health endpoint to ensure the server and its dependencies are ready
 */
async function isServerAvailable(
	baseUrl: string,
	maxAttempts = 30,
): Promise<boolean> {
	const healthUrl = `${baseUrl}/api/health`;
	console.log(`🔍 Checking server availability at ${healthUrl}...`);

	for (let i = 0; i < maxAttempts; i++) {
		try {
			const response = await fetch(healthUrl);
			if (response.ok) {
				const data = await response.json();
				if (data.status === "healthy") {
					console.log(`✅ Server is healthy (attempt ${i + 1}/${maxAttempts})`);
					return true;
				}
			}
		} catch {
			// Server not ready yet
			if (i % 5 === 0 && i > 0) {
				console.log(`   Still waiting... (attempt ${i + 1}/${maxAttempts})`);
			}
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	console.log(`❌ Server not available after ${maxAttempts} attempts`);
	return false;
}

/**
 * Global Setup for Playwright E2E Tests
 *
 * This runs once before all tests start.
 * Use for:
 * - Database setup/migrations
 * - Test data seeding
 * - Authentication state preparation (only if server is already running)
 * - Environment validation
 *
 * Note: This runs BEFORE the webServer starts, so auth setup
 * requires the server to already be running manually.
 */
async function globalSetup(_config: FullConfig) {
	console.log("\n🚀 Starting Playwright E2E Test Suite Global Setup...\n");

	// Load environment variables
	dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });
	dotenv.config({ path: path.resolve(__dirname, "../../.env") });

	// Validate required environment variables
	const requiredEnvVars = [
		"DATABASE_URL",
		"BETTER_AUTH_SECRET",
		"NEXT_PUBLIC_APP_URL",
		"NEXT_PUBLIC_API_URL",
	];

	const missingEnvVars = requiredEnvVars.filter(
		(envVar) => !process.env[envVar],
	);
	if (missingEnvVars.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missingEnvVars.join(", ")}`,
		);
	}

	// Ensure we're using a test database
	if (!process.env.DATABASE_URL?.includes("test")) {
		console.warn(
			"⚠️  WARNING: DATABASE_URL does not contain 'test'. Ensure you're using a test database!",
		);
	}

	console.log("✅ Environment variables validated");

	// Skip database migrations for now - they require PostgreSQL to be running
	console.log("⏭️  Skipping database migrations (development setup)");
	console.log(
		"   Note: Run 'bun run db:push' manually if database tests are needed",
	);

	// Skip test data seeding for now
	console.log("⏭️  Skipping test database seeding (development setup)");

	// Create authenticated session state for reuse
	// Note: This only works if the server is already running (manual start)
	// The webServer configured in playwright.config.ts starts AFTER globalSetup
	const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
	const serverAvailable = await isServerAvailable(baseURL);

	if (serverAvailable) {
		try {
			console.log("🔐 Creating authenticated session state...");
			const browser = await chromium.launch();
			const context = await browser.newContext();
			const page = await context.newPage();

			// Login with test user
			await page.goto(`${baseURL}/login`);

			// Fill in test credentials (from seed data)
			await page.fill('input[name="email"]', "admin@test.gcmc.com");
			await page.fill('input[name="password"]', "TestPassword123!");
			await page.click('button[type="submit"]');

			// Wait for navigation to dashboard
			await page.waitForURL("**/dashboard", { timeout: 10000 });

			// Save authenticated state
			const storageStatePath = path.resolve(
				__dirname,
				"../fixtures/auth-state.json",
			);
			await context.storageState({ path: storageStatePath });

			await browser.close();
			console.log("✅ Authenticated session state saved");
		} catch (error) {
			console.error("❌ Failed to create authenticated session:", error);
			console.warn(
				"⚠️  Tests requiring authentication may fail. Check credentials and server state.",
			);
			// Don't throw - some tests might not require auth
		}
	} else {
		console.log(
			"⚠️  Web server not available during global setup. Skipping auth state creation.",
		);
		console.log(
			"   Auth state will be created when webServer starts (if configured).",
		);
		console.log(
			"   Tests can still authenticate individually using test fixtures.",
		);
	}

	console.log("\n✅ Global Setup Completed Successfully!\n");
}

export default globalSetup;
