import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(moduleDir, ".env") });

import prisma from "@GCMC-KAJ/db";

async function checkUsers() {
    console.log("🔍 Checking database connection and users...");

    try {
        // First, test database connection
        console.log("\n📊 Database Connection Test:");
        await prisma.$queryRaw`SELECT version()`;
        console.log("✅ Database connection successful");

        // Check if database and tables exist
        console.log("\n📋 Checking database schema:");
        const tableCheck = await prisma.$queryRaw`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('user', 'tenant', 'role')
            ORDER BY table_name;
        `;
        console.log("✅ Found tables:", tableCheck);

        // Get all users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                emailVerified: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        console.log(`\n👥 Found ${users.length} users in database:`);
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} (${user.name}) - Verified: ${user.emailVerified ? '✅' : '❌'} - Created: ${user.createdAt.toISOString()}`);
        });

        // Check specifically for admin@gcmc-kaj.com
        const adminUser = users.find(u => u.email === "admin@gcmc-kaj.com");

        if (adminUser) {
            console.log(`\n✅ Admin user exists: ${adminUser.email} (ID: ${adminUser.id})`);
            console.log(`   - Name: ${adminUser.name}`);
            console.log(`   - Email Verified: ${adminUser.emailVerified ? '✅' : '❌'}`);
            console.log(`   - Created: ${adminUser.createdAt.toISOString()}`);

            // Check if admin has tenant and role assignments
            const adminTenantUsers = await prisma.tenantUser.findMany({
                where: { userId: adminUser.id },
                include: {
                    tenant: { select: { name: true, code: true } },
                    role: { select: { name: true, description: true } }
                }
            });

            if (adminTenantUsers.length > 0) {
                console.log("   - Tenant/Role assignments:");
                adminTenantUsers.forEach((tu, i) => {
                    console.log(`     ${i + 1}. Tenant: ${tu.tenant.name} (${tu.tenant.code}) | Role: ${tu.role.name}`);
                });
            } else {
                console.log("   ⚠️  No tenant/role assignments found for admin user");
            }
        } else {
            console.log(`\n❌ Admin user 'admin@gcmc-kaj.com' does not exist`);

            // Get admin credentials from environment
            const adminEmail = process.env.ADMIN_EMAIL || "admin@gcmc-kaj.com";
            const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!@#";

            console.log(`\n🔧 Creating admin user with email: ${adminEmail}`);

            try {
                // Import auth to use its API
                const { auth } = await import("@GCMC-KAJ/auth");

                // Create admin user using Better Auth
                const result = await auth.api.signUpEmail({
                    body: {
                        email: adminEmail,
                        password: adminPassword,
                        name: "GCMC-KAJ Admin"
                    }
                });

                console.log("✅ Admin user created successfully");
                console.log("   - Email:", adminEmail);
                console.log("   - Password:", adminPassword);
                console.log("   - Result:", result);

                // Verify the user was created
                const newAdminUser = await prisma.user.findUnique({
                    where: { email: adminEmail }
                });

                if (newAdminUser) {
                    console.log(`✅ Verification: Admin user found in database with ID: ${newAdminUser.id}`);
                } else {
                    console.log("❌ Verification failed: Admin user not found after creation");
                }

            } catch (createError: any) {
                console.log("❌ Failed to create admin user:", createError?.message || createError);

                // If Better Auth fails, we could try direct database insertion as fallback
                console.log("\n🔧 Attempting direct database insertion as fallback...");
                try {
                    // Note: In a real scenario, you'd want to properly hash the password
                    // This is a simplified approach for demonstration
                    const bcrypt = await import("bcryptjs");
                    const hashedPassword = await bcrypt.hash(adminPassword, 12);

                    const directUser = await prisma.user.create({
                        data: {
                            email: adminEmail,
                            name: "GCMC-KAJ Admin",
                            emailVerified: true,
                            accounts: {
                                create: {
                                    accountId: adminEmail,
                                    providerId: "credential",
                                    password: hashedPassword
                                }
                            }
                        }
                    });

                    console.log("✅ Admin user created via direct database insertion");
                    console.log("   - Email:", adminEmail);
                    console.log("   - ID:", directUser.id);

                } catch (directError: any) {
                    console.log("❌ Direct database insertion also failed:", directError?.message || directError);
                }
            }
        }

    } catch (error) {
        console.error("❌ Database check failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers().catch(console.error);