/**
 * Storage Package Test Setup
 */

import { afterAll, beforeAll } from "vitest";

// Mock MinIO client for all storage tests
beforeAll(() => {
	process.env.NODE_ENV = "test";
});

afterAll(() => {
	// Cleanup if needed
});
