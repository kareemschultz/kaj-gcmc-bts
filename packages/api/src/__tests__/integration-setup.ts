/**
 * API Package Integration Test Setup
 */

import prisma from "@GCMC-KAJ/db";
import { afterAll, beforeAll } from "vitest";

beforeAll(async () => {
	process.env.NODE_ENV = "test";
	process.env.DATABASE_URL =
		process.env.TEST_DATABASE_URL ||
		"postgresql://test:test@localhost:5432/test_gcmc";

	// Ensure test database is clean before running integration tests
	try {
		// Clean up any existing test data
		await prisma.generatedReport.deleteMany({
			where: { tenantId: { gt: 99999 } },
		}); // Test tenant IDs > 99999
		await prisma.client.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.taxFiling.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.businessRegistration.deleteMany({
			where: { tenantId: { gt: 99999 } },
		});
		await prisma.penalty.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.deadline.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.rolePermission.deleteMany({
			where: { role: { tenantId: { gt: 99999 } } },
		});
		await prisma.userRole.deleteMany({
			where: { user: { tenantId: { gt: 99999 } } },
		});
		await prisma.role.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.user.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.tenant.deleteMany({ where: { id: { gt: 99999 } } });
	} catch (error) {
		console.warn("Could not clean test database:", error);
	}
});

afterAll(async () => {
	// Clean up test data after all tests
	try {
		await prisma.generatedReport.deleteMany({
			where: { tenantId: { gt: 99999 } },
		});
		await prisma.client.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.taxFiling.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.businessRegistration.deleteMany({
			where: { tenantId: { gt: 99999 } },
		});
		await prisma.penalty.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.deadline.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.rolePermission.deleteMany({
			where: { role: { tenantId: { gt: 99999 } } },
		});
		await prisma.userRole.deleteMany({
			where: { user: { tenantId: { gt: 99999 } } },
		});
		await prisma.role.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.user.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await prisma.tenant.deleteMany({ where: { id: { gt: 99999 } } });
	} catch (error) {
		console.warn("Could not clean test database after tests:", error);
	} finally {
		await prisma.$disconnect();
	}
});
