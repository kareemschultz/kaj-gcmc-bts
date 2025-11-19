import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(moduleDir, ".env") });

import prisma from "@GCMC-KAJ/db";

async function checkAdminAuthentication() {
    console.log("🔐 Checking admin user authentication setup...");

    try {
        const adminEmail = "admin@gcmc-kaj.com";

        // Get the admin user with account details
        const adminUser = await prisma.user.findUnique({
            where: { email: adminEmail },
            include: {
                accounts: {
                    select: {
                        id: true,
                        accountId: true,
                        providerId: true,
                        password: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                tenantUsers: {
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        },
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                permissions: {
                                    select: {
                                        module: true,
                                        action: true,
                                        allowed: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!adminUser) {
            console.log("❌ Admin user not found");
            return;
        }

        console.log(`\n✅ Admin User Details:`);
        console.log(`   - Email: ${adminUser.email}`);
        console.log(`   - Name: ${adminUser.name}`);
        console.log(`   - ID: ${adminUser.id}`);
        console.log(`   - Email Verified: ${adminUser.emailVerified ? '✅' : '❌'}`);
        console.log(`   - Created: ${adminUser.createdAt.toISOString()}`);
        console.log(`   - Updated: ${adminUser.updatedAt.toISOString()}`);

        console.log(`\n🔑 Authentication Accounts (${adminUser.accounts.length}):`);
        adminUser.accounts.forEach((account, i) => {
            console.log(`   ${i + 1}. Provider: ${account.providerId}`);
            console.log(`      - Account ID: ${account.accountId}`);
            console.log(`      - Has Password: ${account.password ? '✅' : '❌'}`);
            if (account.password) {
                console.log(`      - Password Hash: ${account.password.substring(0, 20)}...`);
            }
            console.log(`      - Created: ${account.createdAt.toISOString()}`);
            console.log(`      - Updated: ${account.updatedAt.toISOString()}`);
        });

        console.log(`\n🏢 Tenant Assignments (${adminUser.tenantUsers.length}):`);
        adminUser.tenantUsers.forEach((tenantUser, i) => {
            console.log(`   ${i + 1}. Tenant: ${tenantUser.tenant.name} (${tenantUser.tenant.code})`);
            console.log(`      - Role: ${tenantUser.role.name}`);
            console.log(`      - Role Description: ${tenantUser.role.description || 'N/A'}`);
            console.log(`      - Permissions (${tenantUser.role.permissions.length}):`);
            tenantUser.role.permissions.forEach((perm, j) => {
                console.log(`        ${j + 1}. ${perm.module}:${perm.action} - ${perm.allowed ? '✅' : '❌'}`);
            });
        });

        // Test password verification using Better Auth
        const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123";
        console.log(`\n🧪 Testing login with password from environment...`);

        try {
            const { auth } = await import("@GCMC-KAJ/auth");

            // Test login
            const signInResult = await auth.api.signInEmail({
                body: {
                    email: adminEmail,
                    password: adminPassword
                }
            });

            console.log("✅ Login test successful!");
            console.log("   - Session created:", !!signInResult);
        } catch (loginError: any) {
            console.log("❌ Login test failed:", loginError?.message || loginError);

            // Check if we need to update the password
            console.log("\n🔧 Attempting to verify password hash...");
            try {
                const bcrypt = await import("bcryptjs");
                const account = adminUser.accounts.find(acc => acc.providerId === "credential");

                if (account?.password) {
                    const isValidPassword = await bcrypt.compare(adminPassword, account.password);
                    console.log(`   - Password matches hash: ${isValidPassword ? '✅' : '❌'}`);

                    if (!isValidPassword) {
                        console.log(`\n🔧 Updating admin password to match environment...`);
                        const newHashedPassword = await bcrypt.hash(adminPassword, 12);

                        await prisma.account.update({
                            where: { id: account.id },
                            data: { password: newHashedPassword }
                        });

                        console.log("✅ Password updated successfully");
                        console.log(`   - New password: ${adminPassword}`);
                    }
                } else {
                    console.log("❌ No credential account found with password");
                }
            } catch (hashError: any) {
                console.log("❌ Password verification failed:", hashError?.message || hashError);
            }
        }

        // Show summary
        console.log(`\n📋 Summary:`);
        console.log(`   - Admin user exists: ✅`);
        console.log(`   - Email: ${adminEmail}`);
        console.log(`   - Password: ${process.env.ADMIN_PASSWORD || "AdminPassword123"}`);
        console.log(`   - Has authentication account: ${adminUser.accounts.length > 0 ? '✅' : '❌'}`);
        console.log(`   - Has role assignments: ${adminUser.tenantUsers.length > 0 ? '✅' : '❌'}`);
        console.log(`   - Email verified: ${adminUser.emailVerified ? '✅' : '❌'}`);

    } catch (error) {
        console.error("❌ Admin authentication check failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminAuthentication().catch(console.error);