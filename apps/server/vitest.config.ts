import { defineConfig } from "vitest/config";

/**
 * Vitest Configuration for Server App
 *
 * Tests for server integration, API endpoints, and request handling
 */
export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/__tests__/**"],
		},
		testTimeout: 15000,
		hookTimeout: 15000,
	},
	resolve: {
		alias: {
			"@GCMC-KAJ/api": "/home/user/kaj-gcmc-bts/packages/api/src",
			"@GCMC-KAJ/auth": "/home/user/kaj-gcmc-bts/packages/auth/src",
			"@GCMC-KAJ/db": "/home/user/kaj-gcmc-bts/packages/db/src",
			"@GCMC-KAJ/rbac": "/home/user/kaj-gcmc-bts/packages/rbac/src",
			"@GCMC-KAJ/types": "/home/user/kaj-gcmc-bts/packages/types/src",
		},
	},
});
