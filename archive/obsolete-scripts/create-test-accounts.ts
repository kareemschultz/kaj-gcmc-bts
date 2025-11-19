#!/usr/bin/env bun

import { PrismaClient } from "./packages/db/prisma/generated/index.js";

async function hash(password: string) {
	// Simple hash implementation for testing
	const crypto = require("node:crypto");
	const salt = crypto.randomBytes(16).toString("hex");
	const hash = crypto
		.pbkdf2Sync(password, salt, 1000, 64, "sha512")
		.toString("hex");
	return `${salt}:${hash}`;
}

async function createTestAccounts() {
	const prisma = new PrismaClient();

	try {
		console.log("🚀 Creating test accounts...");

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

		console.log("\n🎉 Test accounts created successfully!");
		console.log("\n📝 You can now login with these accounts:");
		console.log("-------------------------------------------");
		console.log("👤 Admin Account:");
		console.log("   Email: admin@test.gcmc.com");
		console.log("   Password: TestPassword123!");
		console.log("   Role: Administrator");
		console.log("");
		console.log("👤 Regular User Account:");
		console.log("   Email: user@test.gcmc.com");
		console.log("   Password: TestPassword123!");
		console.log("   Role: Member");
		console.log("-------------------------------------------");
		console.log("\n🌐 Login at: http://localhost:3001/login");
	} catch (error) {
		console.error("❌ Failed to create test accounts:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

createTestAccounts();
