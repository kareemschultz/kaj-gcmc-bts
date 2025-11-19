/**
 * API Package Test Setup
 */

import { afterAll, beforeAll, vi } from "vitest";

// Mock environment variables first
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock Prisma client for unit tests - hoisted mock
vi.mock("@GCMC-KAJ/db", () => {
	const mockPrisma = {
		tenant: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			upsert: vi.fn(),
			count: vi.fn(),
		},
		user: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			upsert: vi.fn(),
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
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			upsert: vi.fn(),
		},
		userRole: {
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		tenantUser: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			upsert: vi.fn(),
		},
		rolePermission: {
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		document: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		documentType: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		session: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		account: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		$disconnect: vi.fn().mockResolvedValue(undefined),
		$connect: vi.fn().mockResolvedValue(undefined),
		$transaction: vi.fn(),
	};

	return {
		__esModule: true,
		default: mockPrisma,
		Prisma: {
			ClientError: class extends Error {
				constructor(
					message: string,
					public clientVersion: string,
				) {
					super(message);
					this.name = "PrismaClientError";
				}
			},
		},
	};
});

beforeAll(() => {
	// Additional environment setup for tests
	process.env.NODE_ENV = "test";
});

afterAll(() => {
	vi.restoreAllMocks();
});
