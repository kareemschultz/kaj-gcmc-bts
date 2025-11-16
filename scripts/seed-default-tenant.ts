#!/usr/bin/env bun

import { PrismaClient } from "../packages/db/prisma/generated/index.js";

const prisma = new PrismaClient();

async function seedDefaultTenant() {
	console.log("🌱 Seeding default tenant and roles...\n");

	try {
		// 1. Create default tenant
		const tenant = await prisma.tenant.upsert({
			where: { code: "default-organization" },
			update: {},
			create: {
				name: "Default Organization",
				code: "default-organization",
				contactInfo: {},
				settings: {},
			},
		});

		console.log(`✅ Default tenant: ${tenant.name} (${tenant.code})`);

		// 2. Create standard roles
		const roles = [
			{
				name: "ADMIN",
				description: "Administrator with full access to all features",
			},
			{
				name: "MANAGER",
				description: "Manager with access to most features",
			},
			{
				name: "MEMBER",
				description: "Standard member with basic access",
			},
			{
				name: "VIEWER",
				description: "Read-only access to view data",
			},
		];

		for (const roleData of roles) {
			const role = await prisma.role.upsert({
				where: {
					tenantId_name: {
						tenantId: tenant.id,
						name: roleData.name,
					},
				},
				update: {},
				create: {
					tenantId: tenant.id,
					name: roleData.name,
					description: roleData.description,
				},
			});

			console.log(`   ✓ Role: ${role.name}`);

			// Create permissions for each role
			if (roleData.name === "ADMIN") {
				await prisma.permission.createMany({
					data: [
						{
							roleId: role.id,
							module: "dashboard",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "users",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "users",
							action: "create",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "users",
							action: "edit",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "users",
							action: "delete",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "clients",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "clients",
							action: "create",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "clients",
							action: "edit",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "clients",
							action: "delete",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "settings",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "settings",
							action: "edit",
							allowed: true,
						},
					],
					skipDuplicates: true,
				});
			} else if (roleData.name === "MANAGER") {
				await prisma.permission.createMany({
					data: [
						{
							roleId: role.id,
							module: "dashboard",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "users",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "clients",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "clients",
							action: "create",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "clients",
							action: "edit",
							allowed: true,
						},
					],
					skipDuplicates: true,
				});
			} else if (roleData.name === "MEMBER") {
				await prisma.permission.createMany({
					data: [
						{
							roleId: role.id,
							module: "dashboard",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "profile",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "profile",
							action: "edit",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "clients",
							action: "view",
							allowed: true,
						},
					],
					skipDuplicates: true,
				});
			} else if (roleData.name === "VIEWER") {
				await prisma.permission.createMany({
					data: [
						{
							roleId: role.id,
							module: "dashboard",
							action: "view",
							allowed: true,
						},
						{
							roleId: role.id,
							module: "profile",
							action: "view",
							allowed: true,
						},
					],
					skipDuplicates: true,
				});
			}
		}

		console.log("\n🎉 Default tenant and roles seeded successfully!");
		console.log("\nRoles created:");
		console.log("  • ADMIN   - Full access");
		console.log("  • MANAGER - Client management");
		console.log("  • MEMBER  - Basic access (default for new users)");
		console.log("  • VIEWER  - Read-only access\n");
	} catch (error) {
		console.error("❌ Failed to seed default tenant:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

seedDefaultTenant();
