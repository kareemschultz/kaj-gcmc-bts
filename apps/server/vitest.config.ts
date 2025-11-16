import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "../..");
const fromRoot = (relativePath: string) =>
	path.resolve(monorepoRoot, relativePath);

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
			"@GCMC-KAJ/api": fromRoot("packages/api/src"),
			"@GCMC-KAJ/auth": fromRoot("packages/auth/src"),
			"@GCMC-KAJ/db": fromRoot("packages/db/src"),
			"@GCMC-KAJ/rbac": fromRoot("packages/rbac/src"),
			"@GCMC-KAJ/types": fromRoot("packages/types/src"),
		},
	},
});
