/**
 * API Package Test Setup
 */

import { afterAll, beforeAll, vi } from "vitest";

// Mock Prisma client for unit tests
vi.mock("@GCMC-KAJ/db", () => ({
	db: {
		tenant: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		user: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		client: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
			aggregate: vi.fn(),
		},
		taxFiling: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
			aggregate: vi.fn(),
		},
		businessRegistration: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		penalty: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			aggregate: vi.fn(),
		},
		deadline: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		generatedReport: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			count: vi.fn(),
			aggregate: vi.fn(),
		},
		role: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		userRole: {
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		rolePermission: {
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
	},
}));

beforeAll(() => {
	process.env.NODE_ENV = "test";
	process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

afterAll(() => {
	vi.restoreAllMocks();
});
