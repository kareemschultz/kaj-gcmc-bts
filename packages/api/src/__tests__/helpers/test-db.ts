/**
 * Test Database Utilities
 *
 * Helper functions for setting up and cleaning up test database
 */

import prisma from "@GCMC-KAJ/db";
import type { UserRole } from "@GCMC-KAJ/types";

/**
 * Test fixtures - these will be created during setup
 */
export const testFixtures = {
	tenant: {
		id: 1,
		name: "Test Firm",
		code: "TEST-FIRM",
	},
	users: {
		superAdmin: {
			id: "test-superadmin-1",
			email: "superadmin@test.com",
			name: "Super Admin Test",
			role: "SuperAdmin" as UserRole,
		},
		firmAdmin: {
			id: "test-firmadmin-1",
			email: "firmadmin@test.com",
			name: "Firm Admin Test",
			role: "FirmAdmin" as UserRole,
		},
		complianceManager: {
			id: "test-compliance-mgr-1",
			email: "compliance@test.com",
			name: "Compliance Manager Test",
			role: "ComplianceManager" as UserRole,
		},
		complianceOfficer: {
			id: "test-compliance-off-1",
			email: "officer@test.com",
			name: "Compliance Officer Test",
			role: "ComplianceOfficer" as UserRole,
		},
		documentOfficer: {
			id: "test-doc-officer-1",
			email: "doc@test.com",
			name: "Document Officer Test",
			role: "DocumentOfficer" as UserRole,
		},
		viewer: {
			id: "test-viewer-1",
			email: "viewer@test.com",
			name: "Viewer Test",
			role: "Viewer" as UserRole,
		},
	},
	clients: [] as Array<{ id: number; name: string }>,
	documents: [] as Array<{ id: number; name: string }>,
};

/**
 * Set up test database with initial data
 */
export async function setupTestDb() {
	try {
		// Create roles first (they're referenced by other tables)
		const roles = await Promise.all([
			prisma.role.upsert({
				where: { name: "SuperAdmin" },
				update: {},
				create: {
					name: "SuperAdmin",
					description: "Full system access",
					permissions: {
						create: { module: "*", action: "*" },
					},
				},
			}),
			prisma.role.upsert({
				where: { name: "FirmAdmin" },
				update: {},
				create: {
					name: "FirmAdmin",
					description: "Full tenant access",
					permissions: {
						createMany: {
							data: [
								{ module: "clients", action: "*" },
								{ module: "documents", action: "*" },
								{ module: "filings", action: "*" },
								{ module: "users", action: "*" },
							],
						},
					},
				},
			}),
			prisma.role.upsert({
				where: { name: "ComplianceManager" },
				update: {},
				create: {
					name: "ComplianceManager",
					description: "Compliance management",
					permissions: {
						createMany: {
							data: [
								{ module: "clients", action: "view" },
								{ module: "compliance", action: "*" },
								{ module: "filings", action: "*" },
							],
						},
					},
				},
			}),
			prisma.role.upsert({
				where: { name: "ComplianceOfficer" },
				update: {},
				create: {
					name: "ComplianceOfficer",
					description: "Compliance officer",
				},
			}),
			prisma.role.upsert({
				where: { name: "DocumentOfficer" },
				update: {},
				create: {
					name: "DocumentOfficer",
					description: "Document management",
				},
			}),
			prisma.role.upsert({
				where: { name: "Viewer" },
				update: {},
				create: {
					name: "Viewer",
					description: "Read-only access",
				},
			}),
		]);

		// Create test tenant
		const tenant = await prisma.tenant.upsert({
			where: { code: testFixtures.tenant.code },
			update: {},
			create: {
				name: testFixtures.tenant.name,
				code: testFixtures.tenant.code,
				settings: {},
			},
		});
		testFixtures.tenant.id = tenant.id;

		// Create test users
		const users = Object.values(testFixtures.users);
		for (const userData of users) {
			const user = await prisma.user.upsert({
				where: { email: userData.email },
				update: {},
				create: {
					id: userData.id,
					email: userData.email,
					name: userData.name,
					emailVerified: true,
				},
			});

			// Find the role
			const role = roles.find((r) => r.name === userData.role);
			if (!role) {
				throw new Error(`Role ${userData.role} not found`);
			}

			// Create TenantUser relationship
			await prisma.tenantUser.upsert({
				where: {
					tenantId_userId: {
						tenantId: tenant.id,
						userId: user.id,
					},
				},
				update: {},
				create: {
					tenantId: tenant.id,
					userId: user.id,
					roleId: role.id,
				},
			});
		}

		// Create sample test clients
		const client1 = await prisma.client.create({
			data: {
				name: "Test Client 1",
				type: "individual",
				email: "client1@test.com",
				tenantId: tenant.id,
			},
		});

		const client2 = await prisma.client.create({
			data: {
				name: "Test Company Ltd",
				type: "company",
				email: "company@test.com",
				tenantId: tenant.id,
			},
		});

		testFixtures.clients = [
			{ id: client1.id, name: client1.name },
			{ id: client2.id, name: client2.name },
		];

		// Create sample document type
		const docType = await prisma.documentType.create({
			data: {
				name: "Test Document Type",
				code: "TEST-DOC",
				tenantId: tenant.id,
			},
		});

		// Create sample documents
		const doc1 = await prisma.document.create({
			data: {
				name: "Test Document 1",
				fileName: "test-doc-1.pdf",
				fileSize: 1024,
				mimeType: "application/pdf",
				storagePath: "test/doc1.pdf",
				documentTypeId: docType.id,
				clientId: client1.id,
				tenantId: tenant.id,
				uploadedBy: testFixtures.users.firmAdmin.id,
			},
		});

		testFixtures.documents = [{ id: doc1.id, name: doc1.name }];

		return testFixtures;
	} catch (error) {
		console.error("Error setting up test database:", error);
		throw error;
	}
}

/**
 * Clean up test database - delete all test data
 */
export async function cleanupTestDb() {
	try {
		// Delete in reverse order of dependencies
		await prisma.document.deleteMany({
			where: { tenantId: testFixtures.tenant.id },
		});
		await prisma.documentType.deleteMany({
			where: { tenantId: testFixtures.tenant.id },
		});
		await prisma.client.deleteMany({
			where: { tenantId: testFixtures.tenant.id },
		});
		await prisma.tenantUser.deleteMany({
			where: { tenantId: testFixtures.tenant.id },
		});
		await prisma.tenant.deleteMany({
			where: { code: testFixtures.tenant.code },
		});

		// Clean up users
		const userIds = Object.values(testFixtures.users).map((u) => u.id);
		await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
		await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
		await prisma.user.deleteMany({
			where: { id: { in: userIds } },
		});

		// Reset fixtures
		testFixtures.clients = [];
		testFixtures.documents = [];
	} catch (error) {
		console.error("Error cleaning up test database:", error);
		throw error;
	}
}

/**
 * Reset test database - clean and re-setup
 */
export async function resetTestDb() {
	await cleanupTestDb();
	await setupTestDb();
}

/**
 * Create a test client for testing
 */
export async function createTestClient(data: {
	name: string;
	type: "individual" | "company" | "partnership";
	email?: string;
}) {
	return await prisma.client.create({
		data: {
			...data,
			tenantId: testFixtures.tenant.id,
		},
	});
}

/**
 * Create a test document for testing
 */
export async function createTestDocument(data: {
	name: string;
	clientId: number;
	uploadedBy: string;
}) {
	// Get or create a document type
	let docType = await prisma.documentType.findFirst({
		where: { tenantId: testFixtures.tenant.id },
	});

	if (!docType) {
		docType = await prisma.documentType.create({
			data: {
				name: "Test Document Type",
				code: "TEST-DOC",
				tenantId: testFixtures.tenant.id,
			},
		});
	}

	return await prisma.document.create({
		data: {
			name: data.name,
			fileName: `${data.name}.pdf`,
			fileSize: 1024,
			mimeType: "application/pdf",
			storagePath: `test/${data.name}.pdf`,
			documentTypeId: docType.id,
			clientId: data.clientId,
			tenantId: testFixtures.tenant.id,
			uploadedBy: data.uploadedBy,
		},
	});
}
