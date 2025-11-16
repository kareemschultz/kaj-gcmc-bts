import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(packageDir, "../..");
const fromRoot = (relativePath: string) =>
	path.resolve(monorepoRoot, relativePath);

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
			"@GCMC-KAJ/types": fromRoot("packages/types/src"),
			"@GCMC-KAJ/rbac": fromRoot("packages/rbac/src"),
		},
	},
});
