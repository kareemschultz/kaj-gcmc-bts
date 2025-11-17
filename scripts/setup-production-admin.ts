#!/usr/bin/env bun

/**
 * Production Admin Setup Script
 *
 * Creates a proper production admin account for GCMC-KAJ platform
 * with appropriate credentials and full FirmAdmin access
 */

import prisma from "@GCMC-KAJ/db";
import { ROLE_DEFINITIONS } from "@GCMC-KAJ/rbac";

const ADMIN_CONFIG = {
	email: "admin@gcmc-kaj.com",
	password: "GCMCAdmin2024!",
	name: "GCMC-KAJ System Administrator",
	organization: "GCMC-KAJ Compliance Platform",
};

async function setupProductionAdmin() {
	console.log("🚀 Setting up production admin account...");
	console.log(`📧 Admin Email: ${ADMIN_CONFIG.email}`);

	try {
		// 1. Ensure default tenant exists
		let defaultTenant = await prisma.tenant.findUnique({
			where: { code: "default-organization" },
		});

		if (!defaultTenant) {
			defaultTenant = await prisma.tenant.create({
				data: {
					name: ADMIN_CONFIG.organization,
					code: "default-organization",
					contactInfo: {
						website: "https://gcmc-kaj.com",
						phone: "+1-555-GCMC-KAJ",
					},
					settings: {
						timezone: "America/New_York",
						dateFormat: "MM/DD/YYYY",
						complianceReporting: true,
					},
				},
			});
			console.log(`✅ Created tenant: ${defaultTenant.name}`);
		}

		// 2. Ensure FirmAdmin role exists with full permissions
		let firmAdminRole = await prisma.role.findFirst({
			where: {
				tenantId: defaultTenant.id,
				name: "FirmAdmin",
			},
		});

		if (!firmAdminRole) {
			const firmAdminDef = ROLE_DEFINITIONS.find((r) => r.name === "FirmAdmin");
			if (firmAdminDef) {
				firmAdminRole = await prisma.role.create({
					data: {
						tenantId: defaultTenant.id,
						name: firmAdminDef.name,
						description: firmAdminDef.description,
					},
				});

				// Create comprehensive permissions
				const permissionsData = firmAdminDef.permissions.flatMap((perm) =>
					perm.actions.map((action) => ({
						roleId: firmAdminRole?.id,
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
					`✅ Created FirmAdmin role with ${permissionsData.length} permissions`,
				);
			}
		}

		// 3. Check if admin user already exists
		const existingAdmin = await prisma.user.findUnique({
			where: { email: ADMIN_CONFIG.email },
		});

		if (existingAdmin) {
			console.log(`⚠️  Admin user already exists: ${ADMIN_CONFIG.email}`);

			// Update to FirmAdmin role if not already
			const tenantUser = await prisma.tenantUser.findFirst({
				where: {
					userId: existingAdmin.id,
					tenantId: defaultTenant.id,
				},
			});

			if (tenantUser && firmAdminRole) {
				await prisma.tenantUser.update({
					where: { id: tenantUser.id },
					data: { roleId: firmAdminRole.id },
				});
				console.log("✅ Updated existing admin to FirmAdmin role");
			}
		} else {
			// 4. Create new admin user via Better-Auth
			console.log("📝 Creating new admin account...");

			try {
				const signupResponse = await fetch(
					"http://localhost:3000/api/auth/sign-up/email",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							email: ADMIN_CONFIG.email,
							password: ADMIN_CONFIG.password,
							name: ADMIN_CONFIG.name,
						}),
					},
				);

				if (signupResponse.ok) {
					console.log("✅ Admin account created via Better-Auth");

					// Find the user and upgrade role
					const newAdmin = await prisma.user.findUnique({
						where: { email: ADMIN_CONFIG.email },
					});

					if (newAdmin && firmAdminRole) {
						await prisma.tenantUser.updateMany({
							where: {
								userId: newAdmin.id,
								tenantId: defaultTenant.id,
							},
							data: {
								roleId: firmAdminRole.id,
							},
						});

						console.log("✅ Upgraded admin to FirmAdmin role");
					}
				} else {
					const errorText = await signupResponse.text();
					throw new Error(
						`Signup failed: ${signupResponse.status} - ${errorText}`,
					);
				}
			} catch (fetchError) {
				console.log(`⚠️  API signup failed: ${fetchError}`);
				console.log("📝 Creating admin user directly in database...");

				// Fallback: create user directly
				const adminUser = await prisma.user.create({
					data: {
						email: ADMIN_CONFIG.email,
						name: ADMIN_CONFIG.name,
						emailVerified: new Date(),
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

					console.log("✅ Admin user created (password must be set manually)");
				}
			}
		}

		// 5. Display final setup information
		console.log("\n🎉 ADMIN SETUP COMPLETE!");
		console.log("═".repeat(60));
		console.log("🌐 Platform URL: http://localhost:3001");
		console.log(`📧 Admin Email: ${ADMIN_CONFIG.email}`);
		console.log(`🔒 Password: ${ADMIN_CONFIG.password}`);
		console.log(`👤 Full Name: ${ADMIN_CONFIG.name}`);
		console.log("🛡️  Access Level: FirmAdmin (Full Platform Access)");
		console.log(`🏢 Organization: ${ADMIN_CONFIG.organization}`);
		console.log("═".repeat(60));

		console.log("\n📋 Admin Capabilities:");
		console.log("   ✅ Full user management (/admin/users)");
		console.log("   ✅ All compliance operations");
		console.log("   ✅ Document and filing management");
		console.log("   ✅ Analytics and reporting");
		console.log("   ✅ System configuration");
		console.log("   ✅ Audit log access");

		console.log("\n💡 Next Steps:");
		console.log("   1. Login with the credentials above");
		console.log("   2. Complete the onboarding wizard");
		console.log("   3. Invite your compliance team");
		console.log("   4. Configure organization settings");

		console.log("\n🔐 Security Notes:");
		console.log("   • Change the default password after first login");
		console.log("   • Enable 2FA if available");
		console.log("   • Store credentials securely");
	} catch (error) {
		console.error("❌ Admin setup failed:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

setupProductionAdmin();
