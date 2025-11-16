import { execSync } from "node:child_process";
import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";
import * as dotenv from "dotenv";

/**
 * Global Setup for Playwright E2E Tests
 *
 * This runs once before all tests start.
 * Use for:
 * - Database setup/migrations
 * - Test data seeding
 * - Authentication state preparation
 * - Environment validation
 */
async function globalSetup(config: FullConfig) {
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

	// Run database migrations
	try {
		console.log("🔄 Running database migrations...");
		execSync("bun run db:push", {
			cwd: path.resolve(__dirname, "../.."),
			stdio: "inherit",
		});
		console.log("✅ Database migrations completed");
	} catch (error) {
		console.error("❌ Database migration failed:", error);
		throw error;
	}

	// Seed test data
	try {
		console.log("🌱 Seeding test database...");
		const { seedTestDatabase } = await import("../utils/seed-database");
		await seedTestDatabase();
		console.log("✅ Test database seeded successfully");
	} catch (error) {
		console.error("❌ Database seeding failed:", error);
		// Don't throw - seeding might fail if data already exists
		console.warn("⚠️  Continuing without fresh seed data...");
	}

	// Create authenticated session state for reuse
	try {
		console.log("🔐 Creating authenticated session state...");
		const browser = await chromium.launch();
		const context = await browser.newContext();
		const page = await context.newPage();

		// Login with test user
		const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
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
			"⚠️  Tests requiring authentication may fail. Ensure the web server is running.",
		);
		// Don't throw - some tests might not require auth
	}

	console.log("\n✅ Global Setup Completed Successfully!\n");
}

export default globalSetup;
