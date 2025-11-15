import { defineConfig } from "vitest/config";

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
			"@GCMC-KAJ/api": "/home/user/kaj-gcmc-bts/packages/api/src",
			"@GCMC-KAJ/auth": "/home/user/kaj-gcmc-bts/packages/auth/src",
			"@GCMC-KAJ/db": "/home/user/kaj-gcmc-bts/packages/db/src",
			"@GCMC-KAJ/rbac": "/home/user/kaj-gcmc-bts/packages/rbac/src",
			"@GCMC-KAJ/types": "/home/user/kaj-gcmc-bts/packages/types/src",
			"@GCMC-KAJ/storage": "/home/user/kaj-gcmc-bts/packages/storage/src",
		},
	},
});
