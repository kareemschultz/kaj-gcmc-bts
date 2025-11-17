#!/usr/bin/env bun

import { PrismaClient } from "../packages/db/prisma/generated/index.js";

const prisma = new PrismaClient();

async function migrateExistingUsers() {
	console.log("🔄 Migrating existing users to default tenant...\n");

	try {
		// Find all users without tenant assignment
		const usersWithoutTenant = await prisma.user.findMany({
			where: {
				tenantUsers: {
					none: {},
				},
			},
			select: {
				id: true,
				email: true,
				name: true,
			},
		});

		console.log(
			`Found ${usersWithoutTenant.length} users without tenant assignment\n`,
		);

		if (usersWithoutTenant.length === 0) {
			console.log("✅ All users already have tenant assignments!");
			return;
		}

		// Get default tenant and MEMBER role
		const defaultTenant = await prisma.tenant.findUnique({
			where: { code: "default-organization" },
		});

		if (!defaultTenant) {
			console.error("❌ Default tenant not found!");
			console.log("\nPlease run the seed script first:");
			console.log("  bun run scripts/seed-default-tenant.ts\n");
			throw new Error("Default tenant not found");
		}

		const memberRole = await prisma.role.findFirst({
			where: {
				tenantId: defaultTenant.id,
				name: "MEMBER",
			},
		});

		if (!memberRole) {
			console.error("❌ MEMBER role not found!");
			console.log("\nPlease run the seed script first:");
			console.log("  bun run scripts/seed-default-tenant.ts\n");
			throw new Error("MEMBER role not found");
		}

		console.log(`Using tenant: ${defaultTenant.name} (${defaultTenant.code})`);
		console.log(`Using role: ${memberRole.name}\n`);

		// Assign all users to default tenant with MEMBER role
		let assignedCount = 0;
		for (const user of usersWithoutTenant) {
			try {
				await prisma.tenantUser.create({
					data: {
						userId: user.id,
						tenantId: defaultTenant.id,
						roleId: memberRole.id,
					},
				});
				console.log(
					`✅ ${user.email} → ${defaultTenant.code} (${memberRole.name})`,
				);
				assignedCount++;
			} catch (error: unknown) {
				if (
					error &&
					typeof error === "object" &&
					"code" in error &&
					error.code === "P2002"
				) {
					console.log(`ℹ️  ${user.email} already assigned (skipping)`);
				} else {
					console.error(
						`❌ Failed to assign ${user.email}:`,
						error instanceof Error ? error.message : String(error),
					);
				}
			}
		}

		console.log(`\n🎉 Migration complete! Assigned ${assignedCount} users.\n`);
	} catch (error) {
		console.error("\n❌ Migration failed:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

migrateExistingUsers();
