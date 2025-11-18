/**
 * Vitest Workspace Configuration
 *
 * Defines test environments and configurations for the monorepo
 */

import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	// API Package Tests
	{
		extends: "./packages/api/vitest.config.ts",
		test: {
			name: "api",
			root: "./packages/api",
			environment: "node",
			include: ["src/**/*.test.ts"],
			exclude: ["src/**/*.integration.test.ts", "src/**/*.e2e.test.ts"],
			setupFiles: ["./src/__tests__/setup.ts"],
			coverage: {
				provider: "v8",
				include: ["src/**/*.ts"],
				exclude: [
					"src/**/*.test.ts",
					"src/**/*.integration.test.ts",
					"src/**/__tests__/**",
					"src/**/types.ts",
				],
				thresholds: {
					global: {
						branches: 80,
						functions: 80,
						lines: 80,
						statements: 80,
					},
				},
			},
		},
	},

	// API Integration Tests
	{
		extends: "./packages/api/vitest.config.ts",
		test: {
			name: "api-integration",
			root: "./packages/api",
			environment: "node",
			include: ["src/**/*.integration.test.ts"],
			setupFiles: ["./src/__tests__/integration-setup.ts"],
			testTimeout: 30000, // Longer timeout for integration tests
			hookTimeout: 30000,
		},
	},

	// Storage Package Tests
	{
		extends: "./packages/storage/vitest.config.ts",
		test: {
			name: "storage",
			root: "./packages/storage",
			environment: "node",
			include: ["src/**/*.test.ts"],
			setupFiles: ["./src/__tests__/setup.ts"],
			coverage: {
				provider: "v8",
				include: ["src/**/*.ts"],
				exclude: ["src/**/*.test.ts", "src/**/__tests__/**"],
				thresholds: {
					global: {
						branches: 75,
						functions: 75,
						lines: 75,
						statements: 75,
					},
				},
			},
		},
	},

	// Worker Package Tests
	{
		extends: "./apps/worker/vitest.config.ts",
		test: {
			name: "worker",
			root: "./apps/worker",
			environment: "node",
			include: ["src/**/*.test.ts"],
			setupFiles: ["./src/__tests__/setup.ts"],
			coverage: {
				provider: "v8",
				include: ["src/**/*.ts"],
				exclude: ["src/**/*.test.ts", "src/**/__tests__/**"],
				thresholds: {
					global: {
						branches: 70,
						functions: 70,
						lines: 70,
						statements: 70,
					},
				},
			},
		},
	},

	// Web App Tests
	{
		extends: "./apps/web/vitest.config.ts",
		test: {
			name: "web",
			root: "./apps/web",
			environment: "jsdom",
			include: ["src/**/*.test.{ts,tsx}"],
			exclude: ["src/**/*.e2e.test.{ts,tsx}"],
			setupFiles: ["./src/__tests__/setup.ts"],
			globals: true,
			coverage: {
				provider: "v8",
				include: ["src/**/*.{ts,tsx}"],
				exclude: [
					"src/**/*.test.{ts,tsx}",
					"src/**/*.e2e.test.{ts,tsx}",
					"src/**/__tests__/**",
					"src/**/*.d.ts",
					"src/components/ui/**", // UI components are third-party
				],
				thresholds: {
					global: {
						branches: 70,
						functions: 70,
						lines: 70,
						statements: 70,
					},
				},
			},
		},
	},

	// E2E Tests
	{
		test: {
			name: "e2e",
			root: "./apps/web",
			include: ["src/**/*.e2e.test.{ts,tsx}"],
			environment: "node",
			testTimeout: 60000, // Longer timeout for E2E tests
			hookTimeout: 60000,
		},
	},
]);
