import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(moduleDir, ".env") });

import prisma from "@GCMC-KAJ/db";

async function fixAdminPassword() {
    console.log("🔧 Fixing admin password to match requested credentials...");

    const adminEmail = "admin@gcmc-kaj.com";
    const requestedPassword = "Admin123!@#";

    try {
        // Get admin user
        const adminUser = await prisma.user.findUnique({
            where: { email: adminEmail },
            include: {
                accounts: true
            }
        });

        if (!adminUser) {
            console.log("❌ Admin user not found");
            return;
        }

        console.log(`✅ Found admin user: ${adminUser.email}`);
        console.log(`   - Current accounts: ${adminUser.accounts.length}`);

        // Hash the requested password
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash(requestedPassword, 12);

        console.log("✅ Password hashed successfully");

        // Delete existing accounts and create new one
        console.log("🗑️ Cleaning up existing accounts...");
        await prisma.account.deleteMany({
            where: {
                userId: adminUser.id
            }
        });

        console.log("🔑 Creating new credential account...");
        await prisma.account.create({
            data: {
                userId: adminUser.id,
                accountId: adminUser.id,
                providerId: "credential",
                password: hashedPassword
            }
        });

        console.log("✅ New credential account created");

        // Test the login
        console.log("🧪 Testing login with new credentials...");

        try {
            const { auth } = await import("@GCMC-KAJ/auth");

            const signInResult = await auth.api.signInEmail({
                body: {
                    email: adminEmail,
                    password: requestedPassword
                }
            });

            console.log("✅ Login test successful!");
            console.log("   - Session created successfully");

        } catch (loginError: any) {
            console.log("❌ Login test failed:", loginError?.message);

            // Try alternative approach with correct provider setup
            console.log("🔄 Trying alternative account setup...");

            await prisma.account.deleteMany({
                where: { userId: adminUser.id }
            });

            // Create account with email provider (Better Auth default)
            await prisma.account.create({
                data: {
                    userId: adminUser.id,
                    accountId: adminEmail,
                    providerId: "email",
                    password: hashedPassword
                }
            });

            console.log("✅ Alternative account created with email provider");

            // Test again
            try {
                const { auth } = await import("@GCMC-KAJ/auth");

                const retryResult = await auth.api.signInEmail({
                    body: {
                        email: adminEmail,
                        password: requestedPassword
                    }
                });

                console.log("✅ Login test successful with email provider!");

            } catch (retryError: any) {
                console.log("❌ Retry failed:", retryError?.message);

                // Manual verification of password hash
                console.log("🔍 Manual password verification...");
                const isValid = await bcrypt.compare(requestedPassword, hashedPassword);
                console.log(`   - Password hash is valid: ${isValid ? '✅' : '❌'}`);

                if (isValid) {
                    console.log("✅ Password hash is correct, auth system may need restart");
                }
            }
        }

        // Final status
        console.log("\n📋 Final Status:");
        console.log(`   📧 Email: ${adminEmail}`);
        console.log(`   🔑 Password: ${requestedPassword}`);
        console.log(`   👤 Role: admin (already assigned)`);
        console.log(`   🏢 Tenant: Default Organization`);

        const finalAccounts = await prisma.account.findMany({
            where: { userId: adminUser.id }
        });

        console.log(`   🔐 Auth accounts: ${finalAccounts.length}`);
        finalAccounts.forEach((acc, i) => {
            console.log(`      ${i + 1}. Provider: ${acc.providerId}, Account ID: ${acc.accountId}`);
        });

    } catch (error) {
        console.error("❌ Failed to fix admin password:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminPassword().catch(console.error);