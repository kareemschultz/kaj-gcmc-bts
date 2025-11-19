#!/usr/bin/env bun
/**
 * Setup Admin User with Proper Tenant and Role
 */

import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(moduleDir, ".env") });

import prisma from "@GCMC-KAJ/db";

async function setupAdminTenant() {
    try {
        console.log("🔧 Setting up admin user with proper tenant and role...");

        const adminEmail = process.env.ADMIN_EMAIL || "admin@gcmc-kaj.com";

        // 1. Find the admin user
        const adminUser = await prisma.user.findUnique({
            where: { email: adminEmail },
            include: { tenantUsers: true }
        });

        if (!adminUser) {
            throw new Error(`Admin user with email ${adminEmail} not found. Please create user first.`);
        }

        console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.id})`);

        // 2. Create or find default tenant
        let defaultTenant = await prisma.tenant.findUnique({
            where: { code: "default-organization" },
        });

        if (!defaultTenant) {
            console.log("📝 Creating default tenant...");
            defaultTenant = await prisma.tenant.create({
                data: {
                    name: "GCMC-KAJ Business Tax Services",
                    code: "default-organization",
                    contactInfo: {
                        email: "support@gcmc-kaj.com",
                        phone: "+592-XXX-XXXX",
                        address: "Georgetown, Guyana"
                    },
                    settings: {
                        timezone: "America/Guyana",
                        currency: "GYD",
                        features: {
                            dashboard: true,
                            analytics: true,
                            compliance: true,
                            notifications: true
                        }
                    },
                },
            });
            console.log(`✅ Created tenant: ${defaultTenant.name} (${defaultTenant.code})`);
        }

        // 3. Create or find Admin role
        let adminRole = await prisma.role.findFirst({
            where: {
                tenantId: defaultTenant.id,
                name: "Admin",
            },
        });

        if (!adminRole) {
            console.log("📝 Creating Admin role...");
            adminRole = await prisma.role.create({
                data: {
                    tenantId: defaultTenant.id,
                    name: "Admin",
                    description: "Full administrative access to all platform features",
                },
            });

            // Create comprehensive permissions for Admin role
            console.log("📝 Creating Admin permissions...");
            await prisma.permission.createMany({
                data: [
                    // Dashboard and analytics
                    { roleId: adminRole.id, module: "dashboard", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "dashboard", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "analytics", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "analytics", action: "edit", allowed: true },

                    // Client management
                    { roleId: adminRole.id, module: "clients", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "clients", action: "create", allowed: true },
                    { roleId: adminRole.id, module: "clients", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "clients", action: "delete", allowed: true },

                    // Document management
                    { roleId: adminRole.id, module: "documents", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "documents", action: "create", allowed: true },
                    { roleId: adminRole.id, module: "documents", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "documents", action: "delete", allowed: true },

                    // Tax filings
                    { roleId: adminRole.id, module: "filings", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "filings", action: "create", allowed: true },
                    { roleId: adminRole.id, module: "filings", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "filings", action: "submit", allowed: true },

                    // Services
                    { roleId: adminRole.id, module: "services", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "services", action: "create", allowed: true },
                    { roleId: adminRole.id, module: "services", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "services", action: "delete", allowed: true },

                    // Compliance
                    { roleId: adminRole.id, module: "compliance", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "compliance", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "compliance", action: "manage", allowed: true },

                    // Tasks
                    { roleId: adminRole.id, module: "tasks", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "tasks", action: "create", allowed: true },
                    { roleId: adminRole.id, module: "tasks", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "tasks", action: "delete", allowed: true },

                    // Notifications
                    { roleId: adminRole.id, module: "notifications", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "notifications", action: "create", allowed: true },
                    { roleId: adminRole.id, module: "notifications", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "notifications", action: "delete", allowed: true },

                    // User management
                    { roleId: adminRole.id, module: "users", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "users", action: "create", allowed: true },
                    { roleId: adminRole.id, module: "users", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "users", action: "delete", allowed: true },

                    // Profile
                    { roleId: adminRole.id, module: "profile", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "profile", action: "edit", allowed: true },

                    // System administration
                    { roleId: adminRole.id, module: "system", action: "view", allowed: true },
                    { roleId: adminRole.id, module: "system", action: "edit", allowed: true },
                    { roleId: adminRole.id, module: "system", action: "manage", allowed: true },
                ],
            });
            console.log(`✅ Created Admin role with comprehensive permissions`);
        }

        // 4. Remove existing tenant assignment if exists
        const existingAssignment = await prisma.tenantUser.findFirst({
            where: { userId: adminUser.id }
        });

        if (existingAssignment) {
            console.log("🗑️  Removing existing tenant assignment...");
            await prisma.tenantUser.delete({
                where: { id: existingAssignment.id }
            });
        }

        // 5. Assign admin user to tenant with Admin role
        console.log("📝 Assigning admin user to tenant with Admin role...");
        await prisma.tenantUser.create({
            data: {
                userId: adminUser.id,
                tenantId: defaultTenant.id,
                roleId: adminRole.id,
            },
        });

        console.log(`✅ Successfully assigned admin user to tenant "${defaultTenant.code}" with Admin role`);

        // 6. Verify the setup
        const verification = await prisma.tenantUser.findFirst({
            where: { userId: adminUser.id },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                },
                tenant: true
            }
        });

        if (verification) {
            console.log("\n🔍 Verification:");
            console.log(`   Tenant: ${verification.tenant.name}`);
            console.log(`   Role: ${verification.role.name}`);
            console.log(`   Permissions: ${verification.role.permissions.length} permissions granted`);
        }

        console.log("\n🎉 Admin user setup completed successfully!");

    } catch (error) {
        console.error("❌ Error setting up admin user:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

setupAdminTenant().catch((error) => {
    console.error("💥 Failed to setup admin user:", error);
    process.exit(1);
});