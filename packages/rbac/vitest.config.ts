import { defineConfig } from "vitest/config";

/**
 * Vitest Configuration for RBAC Package
 *
 * Tests for role-based access control, permissions, and middleware
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
	},
	resolve: {
		alias: {
			"@GCMC-KAJ/types": "/home/user/kaj-gcmc-bts/packages/types/src",
			"@GCMC-KAJ/rbac": "/home/user/kaj-gcmc-bts/packages/rbac/src",
		},
	},
});
