/**
 * Integration Test Context Helper
 *
 * Creates real database test context for integration tests
 */

import { db } from "@GCMC-KAJ/db";
import type { Context } from "../../trpc";

export async function createIntegrationTestContext(): Promise<Context> {
	// Create test tenant
	const tenant = await db.tenant.create({
		data: {
			name: "Integration Test Tenant",
			domain: "test.example.com",
		},
	});

	// Create test user with all permissions
	const user = await db.user.create({
		data: {
			email: "integration-test@example.com",
			name: "Integration Test User",
			tenantId: tenant.id,
			roles: {
				create: {
					role: {
						create: {
							name: "integration-test-admin",
							tenantId: tenant.id,
							permissions: {
								create: [
									{ permission: "compliance:view" },
									{ permission: "compliance:create" },
									{ permission: "compliance:edit" },
									{ permission: "compliance:delete" },
									{ permission: "filings:view" },
									{ permission: "filings:create" },
									{ permission: "filings:edit" },
									{ permission: "filings:delete" },
									{ permission: "reports:view" },
									{ permission: "reports:create" },
									{ permission: "reports:edit" },
									{ permission: "reports:delete" },
									{ permission: "clients:view" },
									{ permission: "clients:create" },
									{ permission: "clients:edit" },
									{ permission: "clients:delete" },
								],
							},
						},
					},
				},
			},
		},
		include: {
			roles: {
				include: {
					role: {
						include: {
							permissions: true,
						},
					},
				},
			},
		},
	});

	return {
		db,
		tenant,
		user: {
			...user,
			permissions: user.roles.flatMap((ur) =>
				ur.role.permissions.map((p) => ({ permission: p.permission })),
			),
		},
	};
}

export async function cleanupIntegrationTestContext(
	context: Context,
): Promise<void> {
	// Clean up in reverse order of creation

	// Delete user roles and permissions
	await db.rolePermission.deleteMany({
		where: {
			role: {
				tenantId: context.tenant.id,
			},
		},
	});

	await db.userRole.deleteMany({
		where: {
			user: {
				tenantId: context.tenant.id,
			},
		},
	});

	await db.role.deleteMany({
		where: {
			tenantId: context.tenant.id,
		},
	});

	// Delete user
	await db.user.deleteMany({
		where: {
			tenantId: context.tenant.id,
		},
	});

	// Delete all tenant-related data
	await db.generatedReport.deleteMany({
		where: {
			tenantId: context.tenant.id,
		},
	});

	await db.client.deleteMany({
		where: {
			tenantId: context.tenant.id,
		},
	});

	await db.taxFiling.deleteMany({
		where: {
			tenantId: context.tenant.id,
		},
	});

	await db.businessRegistration.deleteMany({
		where: {
			tenantId: context.tenant.id,
		},
	});

	await db.penalty.deleteMany({
		where: {
			tenantId: context.tenant.id,
		},
	});

	await db.deadline.deleteMany({
		where: {
			tenantId: context.tenant.id,
		},
	});

	// Finally delete tenant
	await db.tenant.delete({
		where: {
			id: context.tenant.id,
		},
	});
}

// Test data helpers
export function createMockClient(
	tenantId: number,
	userId: number,
	overrides: Partial<any> = {},
) {
	return {
		tenantId,
		name: "Mock Client Ltd",
		email: "mock@client.com",
		businessType: "COMPANY",
		status: "ACTIVE",
		taxId: "MOCK123456",
		createdBy: userId,
		...overrides,
	};
}

export function createMockTaxFiling(
	tenantId: number,
	clientId: number,
	overrides: Partial<any> = {},
) {
	return {
		tenantId,
		clientId,
		type: "GRT",
		period: "2024-01",
		amount: 50000,
		status: "FILED",
		dueDate: new Date("2024-02-15"),
		submittedAt: new Date("2024-02-10"),
		...overrides,
	};
}

export function createMockBusinessRegistration(
	tenantId: number,
	clientId: number,
	overrides: Partial<any> = {},
) {
	return {
		tenantId,
		clientId,
		registrationNumber: "REG123456",
		businessType: "COMPANY",
		status: "ACTIVE",
		registrationDate: new Date("2020-01-01"),
		expiryDate: new Date("2025-01-01"),
		...overrides,
	};
}

export function createMockPenalty(
	tenantId: number,
	clientId: number,
	overrides: Partial<any> = {},
) {
	return {
		tenantId,
		clientId,
		type: "LATE_FILING",
		amount: 500,
		description: "Late GRT filing penalty",
		dueDate: new Date(),
		status: "OUTSTANDING",
		...overrides,
	};
}

export function createMockDeadline(
	tenantId: number,
	overrides: Partial<any> = {},
) {
	return {
		tenantId,
		title: "GRT Monthly Return",
		description: "Monthly GRT filing deadline",
		type: "GRT",
		dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
		penaltyAmount: 1000,
		...overrides,
	};
}
