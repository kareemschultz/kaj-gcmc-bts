import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FullConfig } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global Teardown for Playwright E2E Tests
 *
 * This runs once after all tests complete.
 * Use for:
 * - Cleanup of test data
 * - Closing database connections
 * - Removing temporary files
 * - Generating final reports
 */
async function globalTeardown(_config: FullConfig) {
	console.log("\n🧹 Starting Playwright E2E Test Suite Global Teardown...\n");

	// Clean up auth state file
	try {
		const authStatePath = path.resolve(__dirname, "auth-state.json");
		if (fs.existsSync(authStatePath)) {
			fs.unlinkSync(authStatePath);
			console.log("✅ Cleaned up authentication state file");
		}
	} catch (error) {
		console.warn("⚠️  Failed to clean up auth state:", error);
	}

	// Optional: Clean up test database
	// Uncomment if you want to reset the database after tests
	/*
	try {
		console.log("🗑️  Cleaning up test database...");
		const { cleanupTestDatabase } = await import("../utils/seed-database");
		await cleanupTestDatabase();
		console.log("✅ Test database cleaned up");
	} catch (error) {
		console.error("❌ Database cleanup failed:", error);
	}
	*/

	console.log("\n✅ Global Teardown Completed!\n");
}

export default globalTeardown;
