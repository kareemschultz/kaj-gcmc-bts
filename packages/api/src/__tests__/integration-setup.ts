/**
 * API Package Integration Test Setup
 */

import { db } from "@GCMC-KAJ/db";
import { afterAll, beforeAll } from "vitest";

beforeAll(async () => {
	process.env.NODE_ENV = "test";
	process.env.DATABASE_URL =
		process.env.TEST_DATABASE_URL ||
		"postgresql://test:test@localhost:5432/test_gcmc";

	// Ensure test database is clean before running integration tests
	try {
		// Clean up any existing test data
		await db.generatedReport.deleteMany({ where: { tenantId: { gt: 99999 } } }); // Test tenant IDs > 99999
		await db.client.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.taxFiling.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.businessRegistration.deleteMany({
			where: { tenantId: { gt: 99999 } },
		});
		await db.penalty.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.deadline.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.rolePermission.deleteMany({
			where: { role: { tenantId: { gt: 99999 } } },
		});
		await db.userRole.deleteMany({
			where: { user: { tenantId: { gt: 99999 } } },
		});
		await db.role.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.user.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.tenant.deleteMany({ where: { id: { gt: 99999 } } });
	} catch (error) {
		console.warn("Could not clean test database:", error);
	}
});

afterAll(async () => {
	// Clean up test data after all tests
	try {
		await db.generatedReport.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.client.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.taxFiling.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.businessRegistration.deleteMany({
			where: { tenantId: { gt: 99999 } },
		});
		await db.penalty.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.deadline.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.rolePermission.deleteMany({
			where: { role: { tenantId: { gt: 99999 } } },
		});
		await db.userRole.deleteMany({
			where: { user: { tenantId: { gt: 99999 } } },
		});
		await db.role.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.user.deleteMany({ where: { tenantId: { gt: 99999 } } });
		await db.tenant.deleteMany({ where: { id: { gt: 99999 } } });
	} catch (error) {
		console.warn("Could not clean test database after tests:", error);
	} finally {
		await db.$disconnect();
	}
});
