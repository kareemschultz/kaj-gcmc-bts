/**
 * Global Test Setup
 *
 * This file runs before all tests in the monorepo.
 * Use it for global mocks, environment setup, etc.
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { beforeAll } from "vitest";

// Load test environment variables
beforeAll(() => {
	const root = process.cwd();
	const testEnvPath = path.join(root, ".env.test");
	const defaultEnvPath = path.join(root, ".env");

	const envPath = existsSync(testEnvPath)
		? testEnvPath
		: existsSync(defaultEnvPath)
			? defaultEnvPath
			: undefined;

	if (envPath) {
		config({ path: envPath });
	} else {
		config();
	}

	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL must be defined before running tests. Set it in .env.test or .env.",
		);
	}

	if (!process.env.DATABASE_URL.includes("test")) {
		console.warn(
			"WARNING: DATABASE_URL does not contain 'test'. Make sure you're using a dedicated test database!",
		);
	}
});
