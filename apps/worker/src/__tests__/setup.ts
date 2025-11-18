/**
 * Worker Package Test Setup
 */

import { afterAll, beforeAll, vi } from "vitest";

// Mock BullMQ for all worker tests
vi.mock("bullmq", () => ({
	Job: vi.fn(),
	Queue: vi.fn(() => ({
		add: vi.fn(),
		close: vi.fn(),
	})),
	Worker: vi.fn(() => ({
		close: vi.fn(),
	})),
}));

beforeAll(() => {
	process.env.NODE_ENV = "test";
	process.env.REDIS_URL = "redis://localhost:6379";
});

afterAll(() => {
	vi.restoreAllMocks();
});
