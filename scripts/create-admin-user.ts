#!/usr/bin/env bun

/**
 * Create Admin User Script
 *
 * This script:
 * 1. Upgrades test1@example.com to FirmAdmin role
 * 2. Creates all necessary roles if they don't exist
 * 3. Sets up proper permissions for admin functionality
 */

import prisma from "@GCMC-KAJ/db";
import { ROLE_DEFINITIONS } from "@GCMC-KAJ/rbac";

async function createAdminUser() {
	console.log("🚀 Setting up admin user and roles...");

	try {
		// 1. Find or create default tenant
		let defaultTenant = await prisma.tenant.findUnique({
			where: { code: "default-organization" },
		});

		if (!defaultTenant) {
			console.log("📝 Creating default tenant...");
			defaultTenant = await prisma.tenant.create({
				data: {
					name: "Default Organization",
					code: "default-organization",
					contactInfo: {},
					settings: {},
				},
			});
		}

		console.log(
			`✅ Default tenant: ${defaultTenant.name} (${defaultTenant.code})`,
		);

		// 2. Create all roles from RBAC definitions
		for (const roleDef of ROLE_DEFINITIONS) {
			let role = await prisma.role.findFirst({
				where: {
					tenantId: defaultTenant.id,
					name: roleDef.name,
				},
			});

			if (!role) {
				console.log(`📝 Creating ${roleDef.name} role...`);
				role = await prisma.role.create({
					data: {
						tenantId: defaultTenant.id,
						name: roleDef.name,
						description: roleDef.description,
					},
				});

				// Create permissions for this role
				const permissionsData = roleDef.permissions.flatMap((perm) =>
					perm.actions.map((action) => ({
						roleId: role!.id,
						module: perm.module,
						action: action,
						allowed: true,
					})),
				);

				await prisma.permission.createMany({
					data: permissionsData,
					skipDuplicates: true,
				});

				console.log(
					`✅ Created ${roleDef.name} with ${permissionsData.length} permissions`,
				);
			}
		}

		// 3. Find the test user and upgrade to FirmAdmin
		const testUser = await prisma.user.findUnique({
			where: { email: "test1@example.com" },
		});

		if (!testUser) {
			console.log("❌ Test user not found. Creating proper admin user...");

			// Create a professional admin user with Better-Auth
			const adminEmail = "admin@gcmc-kaj.com";
			const adminPassword = "Admin123!GCMC";
			const adminName = "GCMC-KAJ Administrator";

			try {
				// Use Better-Auth signup API to create user with password
				const signupResponse = await fetch(
					"http://localhost:3000/api/auth/sign-up/email",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							email: adminEmail,
							password: adminPassword,
							name: adminName,
						}),
					},
				);

				if (signupResponse.ok) {
					console.log(`✅ Created admin user via Better-Auth: ${adminEmail}`);

					// Find the newly created user
					const newAdminUser = await prisma.user.findUnique({
						where: { email: adminEmail },
					});

					if (newAdminUser) {
						const firmAdminRole = await prisma.role.findFirst({
							where: {
								tenantId: defaultTenant.id,
								name: "FirmAdmin",
							},
						});

						if (firmAdminRole) {
							// Update the user's role to FirmAdmin
							await prisma.tenantUser.updateMany({
								where: {
									userId: newAdminUser.id,
									tenantId: defaultTenant.id,
								},
								data: {
									roleId: firmAdminRole.id,
								},
							});

							console.log("🎉 ADMIN ACCOUNT CREATED SUCCESSFULLY!");
							console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
							console.log("🌐 Login URL: http://localhost:3001/login");
							console.log(`📧 Email: ${adminEmail}`);
							console.log(`🔒 Password: ${adminPassword}`);
							console.log(`👤 Name: ${adminName}`);
							console.log("🛡️  Role: FirmAdmin (Full Access)");
							console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
							console.log("💡 Save these credentials securely!");
						}
					}
				} else {
					console.log(
						`❌ Failed to create admin user: ${signupResponse.status}`,
					);
					// Fall back to direct database creation
					const adminUser = await prisma.user.create({
						data: {
							email: adminEmail,
							name: adminName,
							emailVerified: new Date(),
						},
					});

					const firmAdminRole = await prisma.role.findFirst({
						where: {
							tenantId: defaultTenant.id,
							name: "FirmAdmin",
						},
					});

					if (firmAdminRole) {
						await prisma.tenantUser.create({
							data: {
								userId: adminUser.id,
								tenantId: defaultTenant.id,
								roleId: firmAdminRole.id,
							},
						});

						console.log(`✅ Created admin user (manual): ${adminUser.email}`);
						console.log("⚠️  Password must be set up manually through login");
					}
				}
			} catch (error) {
				console.log(`❌ Error creating admin user: ${error}`);
			}
		} else {
			console.log(`👤 Found existing user: ${testUser.email}`);

			// Find FirmAdmin role
			const firmAdminRole = await prisma.role.findFirst({
				where: {
					tenantId: defaultTenant.id,
					name: "FirmAdmin",
				},
			});

			if (firmAdminRole) {
				// Update user's role to FirmAdmin
				await prisma.tenantUser.updateMany({
					where: {
						userId: testUser.id,
						tenantId: defaultTenant.id,
					},
					data: {
						roleId: firmAdminRole.id,
					},
				});

				console.log(`✅ Upgraded ${testUser.email} to FirmAdmin role`);
				console.log("🔑 Login URL: http://localhost:3001/login");
				console.log("📧 Email: test1@example.com");
			}
		}

		// 4. Show role summary
		const roles = await prisma.role.findMany({
			where: { tenantId: defaultTenant.id },
			include: {
				_count: {
					select: { permissions: true },
				},
			},
		});

		console.log("\n📋 Available Roles:");
		roles.forEach((role) => {
			console.log(`   ${role.name}: ${role._count.permissions} permissions`);
		});

		// 5. Show users summary
		const tenantUsers = await prisma.tenantUser.findMany({
			where: { tenantId: defaultTenant.id },
			include: {
				user: true,
				role: true,
			},
		});

		console.log("\n👥 Current Users:");
		tenantUsers.forEach((tu) => {
			console.log(`   ${tu.user.email} → ${tu.role.name}`);
		});

		console.log("\n🎉 Admin setup complete!");
		console.log("💡 You can now access /admin/users to manage team members");
	} catch (error) {
		console.error("❌ Setup failed:", error);
	} finally {
		await prisma.$disconnect();
	}
}

createAdminUser();
