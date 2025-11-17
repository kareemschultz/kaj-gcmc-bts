#!/usr/bin/env bun

import prisma from "@GCMC-KAJ/db";

async function checkAdminRole() {
	try {
		console.log("🔍 Checking admin user tenant and role assignment...\n");

		// Get the admin user
		const adminUser = await prisma.user.findUnique({
			where: { email: "admin@gcmc-kaj.com" },
		});

		if (!adminUser) {
			console.log("❌ Admin user not found");
			return;
		}

		console.log(`✅ Admin user found: ${adminUser.id} - ${adminUser.email}`);

		// Get tenant assignment
		const tenantUser = await prisma.tenantUser.findFirst({
			where: { userId: adminUser.id },
			include: {
				role: {
					include: {
						permissions: true,
					},
				},
				tenant: true,
			},
		});

		if (!tenantUser) {
			console.log("❌ Admin user has NO tenant assignment");

			// Create FirmAdmin role and assign to admin
			console.log("\n📝 Creating default tenant and FirmAdmin role...");

			let defaultTenant = await prisma.tenant.findUnique({
				where: { code: "default-organization" },
			});

			if (!defaultTenant) {
				defaultTenant = await prisma.tenant.create({
					data: {
						name: "Default Organization",
						code: "default-organization",
						contactInfo: {},
						settings: {},
					},
				});
			}

			// Create FirmAdmin role
			let adminRole = await prisma.role.findFirst({
				where: {
					tenantId: defaultTenant.id,
					name: "FirmAdmin",
				},
			});

			if (!adminRole) {
				adminRole = await prisma.role.create({
					data: {
						tenantId: defaultTenant.id,
						name: "FirmAdmin",
						description: "Full administrative access to all platform features",
					},
				});

				// Create comprehensive permissions for FirmAdmin
				await prisma.permission.createMany({
					data: [
						// Analytics permissions
						{
							roleId: adminRole.id,
							module: "analytics",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "analytics",
							action: "export",
							allowed: true,
						},

						// User management
						{
							roleId: adminRole.id,
							module: "users",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "users",
							action: "create",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "users",
							action: "edit",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "users",
							action: "delete",
							allowed: true,
						},

						// Role management
						{
							roleId: adminRole.id,
							module: "roles",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "roles",
							action: "create",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "roles",
							action: "edit",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "roles",
							action: "delete",
							allowed: true,
						},

						// Client management
						{
							roleId: adminRole.id,
							module: "clients",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "clients",
							action: "create",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "clients",
							action: "edit",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "clients",
							action: "delete",
							allowed: true,
						},

						// Documents
						{
							roleId: adminRole.id,
							module: "documents",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "documents",
							action: "create",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "documents",
							action: "edit",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "documents",
							action: "delete",
							allowed: true,
						},

						// Filings
						{
							roleId: adminRole.id,
							module: "filings",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "filings",
							action: "create",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "filings",
							action: "edit",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "filings",
							action: "delete",
							allowed: true,
						},

						// Services
						{
							roleId: adminRole.id,
							module: "services",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "services",
							action: "create",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "services",
							action: "edit",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "services",
							action: "delete",
							allowed: true,
						},

						// Dashboard
						{
							roleId: adminRole.id,
							module: "dashboard",
							action: "view",
							allowed: true,
						},

						// Profile
						{
							roleId: adminRole.id,
							module: "profile",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "profile",
							action: "edit",
							allowed: true,
						},

						// Compliance
						{
							roleId: adminRole.id,
							module: "compliance",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "compliance",
							action: "manage",
							allowed: true,
						},

						// Tasks
						{
							roleId: adminRole.id,
							module: "tasks",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "tasks",
							action: "create",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "tasks",
							action: "edit",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "tasks",
							action: "delete",
							allowed: true,
						},

						// Notifications
						{
							roleId: adminRole.id,
							module: "notifications",
							action: "view",
							allowed: true,
						},
						{
							roleId: adminRole.id,
							module: "notifications",
							action: "send",
							allowed: true,
						},
					],
				});
			}

			// Assign admin to tenant with FirmAdmin role
			await prisma.tenantUser.create({
				data: {
					userId: adminUser.id,
					tenantId: defaultTenant.id,
					roleId: adminRole.id,
				},
			});

			console.log(
				`✅ Created and assigned FirmAdmin role to admin user in tenant: ${defaultTenant.code}`,
			);
		} else {
			console.log(
				`✅ Admin user assigned to tenant: ${tenantUser.tenant.name} (${tenantUser.tenant.code})`,
			);
			console.log(
				`✅ Role: ${tenantUser.role.name} (ID: ${tenantUser.role.id})`,
			);
			console.log(
				`✅ Permissions count: ${tenantUser.role.permissions.length}`,
			);

			// Check if analytics:view permission exists
			const analyticsViewPermission = tenantUser.role.permissions.find(
				(p) => p.module === "analytics" && p.action === "view",
			);

			if (analyticsViewPermission) {
				console.log(
					`✅ Has analytics:view permission: ${analyticsViewPermission.allowed}`,
				);
			} else {
				console.log("❌ Missing analytics:view permission");

				// Add missing analytics permission
				await prisma.permission.create({
					data: {
						roleId: tenantUser.role.id,
						module: "analytics",
						action: "view",
						allowed: true,
					},
				});

				console.log("✅ Added analytics:view permission");
			}
		}
	} catch (error) {
		console.error("❌ Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

checkAdminRole();
