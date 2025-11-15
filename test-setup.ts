/**
 * Global Test Setup
 *
 * This file runs before all tests in the monorepo.
 * Use it for global mocks, environment setup, etc.
 */

import { config } from "dotenv";
import { beforeAll } from "vitest";

// Load test environment variables
beforeAll(() => {
	// Load .env.test if it exists, otherwise fall back to .env
	config({ path: ".env.test" });

	// Ensure we're using a test database
	if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("test")) {
		console.warn(
			"WARNING: DATABASE_URL does not contain 'test'. Make sure you're using a test database!",
		);
	}
});
