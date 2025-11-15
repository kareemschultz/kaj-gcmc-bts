import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const fromRoot = (relativePath: string) => path.resolve(rootDir, relativePath);

/**
 * Root Vitest Configuration for KAJ-GCMC Monorepo
 *
 * This configuration is used for running tests across the entire monorepo.
 * Individual packages may have their own vitest.config.ts that extends this.
 */
export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./test-setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"**/node_modules/**",
				"**/dist/**",
				"**/.turbo/**",
				"**/build/**",
				"**/*.config.{js,ts}",
				"**/types/**",
			],
		},
		// Test timeout for async operations
		testTimeout: 10000,
		hookTimeout: 10000,
	},
	resolve: {
		alias: {
			"@GCMC-KAJ/api": fromRoot("packages/api/src"),
			"@GCMC-KAJ/auth": fromRoot("packages/auth/src"),
			"@GCMC-KAJ/db": fromRoot("packages/db/src"),
			"@GCMC-KAJ/rbac": fromRoot("packages/rbac/src"),
			"@GCMC-KAJ/types": fromRoot("packages/types/src"),
			"@GCMC-KAJ/storage": fromRoot("packages/storage/src"),
		},
	},
});
