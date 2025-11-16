import { PrismaClient } from "@GCMC-KAJ/db/generated";
import { hash } from "better-auth/utils/hash";

/**
 * Seed Test Database
 *
 * Creates initial test data for E2E tests.
 */
export async function seedTestDatabase() {
	const prisma = new PrismaClient({
		datasources: {
			db: {
				url: process.env.DATABASE_URL,
			},
		},
	});

	try {
		console.log("🌱 Seeding test database...");

		// Create test tenant
		const testTenant = await prisma.tenant.upsert({
			where: { slug: "test-tenant" },
			update: {},
			create: {
				name: "Test Tenant Organization",
				slug: "test-tenant",
				tier: "PROFESSIONAL",
				status: "ACTIVE",
				settings: {},
			},
		});

		console.log("✅ Test tenant created:", testTenant.slug);

		// Create admin user
		const adminUser = await prisma.user.upsert({
			where: { email: "admin@test.gcmc.com" },
			update: {},
			create: {
				name: "Admin User",
				email: "admin@test.gcmc.com",
				emailVerified: true,
			},
		});

		// Create admin account with password
		await prisma.account.upsert({
			where: {
				providerId_accountId: {
					providerId: "credential",
					accountId: adminUser.id,
				},
			},
			update: {},
			create: {
				userId: adminUser.id,
				providerId: "credential",
				accountId: adminUser.id,
				password: await hash("TestPassword123!"),
			},
		});

		console.log("✅ Admin user created:", adminUser.email);

		// Create regular user
		const regularUser = await prisma.user.upsert({
			where: { email: "user@test.gcmc.com" },
			update: {},
			create: {
				name: "Regular User",
				email: "user@test.gcmc.com",
				emailVerified: true,
			},
		});

		// Create regular user account with password
		await prisma.account.upsert({
			where: {
				providerId_accountId: {
					providerId: "credential",
					accountId: regularUser.id,
				},
			},
			update: {},
			create: {
				userId: regularUser.id,
				providerId: "credential",
				accountId: regularUser.id,
				password: await hash("TestPassword123!"),
			},
		});

		console.log("✅ Regular user created:", regularUser.email);

		// Create client user
		const clientUser = await prisma.user.upsert({
			where: { email: "client@test.gcmc.com" },
			update: {},
			create: {
				name: "Client User",
				email: "client@test.gcmc.com",
				emailVerified: true,
			},
		});

		// Create client user account with password
		await prisma.account.upsert({
			where: {
				providerId_accountId: {
					providerId: "credential",
					accountId: clientUser.id,
				},
			},
			update: {},
			create: {
				userId: clientUser.id,
				providerId: "credential",
				accountId: clientUser.id,
				password: await hash("TestPassword123!"),
			},
		});

		console.log("✅ Client user created:", clientUser.email);

		// Create tenant users (link users to tenant)
		await prisma.tenantUser.upsert({
			where: {
				tenantId_userId: {
					tenantId: testTenant.id,
					userId: adminUser.id,
				},
			},
			update: {},
			create: {
				tenantId: testTenant.id,
				userId: adminUser.id,
				role: "ADMIN",
			},
		});

		await prisma.tenantUser.upsert({
			where: {
				tenantId_userId: {
					tenantId: testTenant.id,
					userId: regularUser.id,
				},
			},
			update: {},
			create: {
				tenantId: testTenant.id,
				userId: regularUser.id,
				role: "MEMBER",
			},
		});

		console.log("✅ Tenant users linked");

		// Create test services
		const complianceService = await prisma.service.upsert({
			where: {
				tenantId_name: {
					tenantId: testTenant.id,
					name: "Compliance Advisory",
				},
			},
			update: {},
			create: {
				tenantId: testTenant.id,
				name: "Compliance Advisory",
				description: "Expert compliance consulting and advisory services",
				category: "COMPLIANCE",
				status: "ACTIVE",
				basePrice: 500,
				currency: "USD",
			},
		});

		console.log("✅ Test service created:", complianceService.name);

		// Create test client
		const testClient = await prisma.client.upsert({
			where: {
				tenantId_email: {
					tenantId: testTenant.id,
					email: "testclient@example.com",
				},
			},
			update: {},
			create: {
				tenantId: testTenant.id,
				fullName: "Test Client Company",
				email: "testclient@example.com",
				phone: "+1234567890",
				status: "ACTIVE",
			},
		});

		console.log("✅ Test client created:", testClient.fullName);

		console.log("✅ Database seeding completed successfully!");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * Cleanup Test Database
 *
 * Removes all test data (use with caution!)
 */
export async function cleanupTestDatabase() {
	const prisma = new PrismaClient({
		datasources: {
			db: {
				url: process.env.DATABASE_URL,
			},
		},
	});

	try {
		console.log("🗑️  Cleaning up test database...");

		// Delete in order to respect foreign key constraints
		await prisma.tenantUser.deleteMany({
			where: {
				tenant: { slug: "test-tenant" },
			},
		});

		await prisma.service.deleteMany({
			where: {
				tenant: { slug: "test-tenant" },
			},
		});

		await prisma.client.deleteMany({
			where: {
				tenant: { slug: "test-tenant" },
			},
		});

		await prisma.account.deleteMany({
			where: {
				user: {
					email: {
						in: [
							"admin@test.gcmc.com",
							"user@test.gcmc.com",
							"client@test.gcmc.com",
						],
					},
				},
			},
		});

		await prisma.user.deleteMany({
			where: {
				email: {
					in: [
						"admin@test.gcmc.com",
						"user@test.gcmc.com",
						"client@test.gcmc.com",
					],
				},
			},
		});

		await prisma.tenant.deleteMany({
			where: { slug: "test-tenant" },
		});

		console.log("✅ Test database cleaned up");
	} catch (error) {
		console.error("❌ Error cleaning up database:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}
