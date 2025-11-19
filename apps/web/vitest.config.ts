import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(packageDir, "../..");
const fromRoot = (relativePath: string) =>
	path.resolve(monorepoRoot, relativePath);

/**
 * Vitest Configuration for Web App
 *
 * Tests for React components, hooks, and frontend logic
 */
export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		include: ["src/**/*.test.{ts,tsx}"],
		exclude: ["src/**/*.e2e.test.{ts,tsx}"],
		setupFiles: ["./src/__tests__/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"src/**/*.e2e.test.{ts,tsx}",
				"src/**/__tests__/**",
				"src/**/*.d.ts",
				"src/components/ui/**", // UI components are third-party
			],
		},
		testTimeout: 10000,
		hookTimeout: 10000,
	},
	resolve: {
		alias: {
			"@": path.resolve(packageDir, "./src"),
			"@GCMC-KAJ/api": fromRoot("packages/api/src"),
			"@GCMC-KAJ/auth": fromRoot("packages/auth/src"),
			"@GCMC-KAJ/db": fromRoot("packages/db/src"),
			"@GCMC-KAJ/rbac": fromRoot("packages/rbac/src"),
			"@GCMC-KAJ/types": fromRoot("packages/types/src"),
			"@GCMC-KAJ/storage": fromRoot("packages/storage/src"),
		},
	},
});
