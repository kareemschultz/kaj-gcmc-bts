import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(moduleDir, ".env") });

import prisma from "@GCMC-KAJ/db";

async function verifyAdminCredentials() {
    console.log("🔐 Verifying admin credentials as requested...");

    const requestedEmail = "admin@gcmc-kaj.com";
    const requestedPassword = "Admin123!@#";

    console.log(`\n📋 Requested Credentials:`);
    console.log(`   - Email: ${requestedEmail}`);
    console.log(`   - Password: ${requestedPassword}`);
    console.log(`   - Role: admin`);

    try {
        // Check if admin user exists
        const adminUser = await prisma.user.findUnique({
            where: { email: requestedEmail },
            include: {
                accounts: true,
                tenantUsers: {
                    include: {
                        role: true,
                        tenant: true
                    }
                }
            }
        });

        if (!adminUser) {
            console.log(`\n❌ Admin user ${requestedEmail} does not exist`);
            console.log(`\n🔧 Creating admin user with requested credentials...`);

            try {
                const { auth } = await import("@GCMC-KAJ/auth");

                const result = await auth.api.signUpEmail({
                    body: {
                        email: requestedEmail,
                        password: requestedPassword,
                        name: "GCMC-KAJ Admin"
                    }
                });

                console.log("✅ Admin user created with requested credentials");

            } catch (createError: any) {
                console.log("❌ Failed to create with Better Auth:", createError?.message);

                // Fallback to direct creation
                const bcrypt = await import("bcryptjs");
                const hashedPassword = await bcrypt.hash(requestedPassword, 12);

                const directUser = await prisma.user.create({
                    data: {
                        email: requestedEmail,
                        name: "GCMC-KAJ Admin",
                        emailVerified: true,
                        accounts: {
                            create: {
                                accountId: requestedEmail,
                                providerId: "credential",
                                password: hashedPassword
                            }
                        }
                    }
                });

                console.log("✅ Admin user created via direct database insertion");
            }
        } else {
            console.log(`\n✅ Admin user ${requestedEmail} already exists`);

            // Test login with requested password
            console.log(`\n🧪 Testing login with requested password...`);

            try {
                const { auth } = await import("@GCMC-KAJ/auth");

                const signInResult = await auth.api.signInEmail({
                    body: {
                        email: requestedEmail,
                        password: requestedPassword
                    }
                });

                console.log("✅ Login successful with requested password!");

            } catch (loginError: any) {
                console.log("❌ Login failed with requested password:", loginError?.message);

                // Update password to match the requested one
                console.log(`\n🔧 Updating password to match requested credentials...`);

                try {
                    const bcrypt = await import("bcryptjs");
                    const hashedPassword = await bcrypt.hash(requestedPassword, 12);

                    // Find the credential account
                    const credentialAccount = adminUser.accounts.find(
                        acc => acc.providerId === "credential" || acc.providerId === "email"
                    );

                    if (credentialAccount) {
                        await prisma.account.update({
                            where: { id: credentialAccount.id },
                            data: { password: hashedPassword }
                        });

                        console.log("✅ Password updated to requested credentials");

                        // Test again
                        const { auth } = await import("@GCMC-KAJ/auth");
                        const retryResult = await auth.api.signInEmail({
                            body: {
                                email: requestedEmail,
                                password: requestedPassword
                            }
                        });

                        console.log("✅ Login verified after password update!");

                    } else {
                        // Create new credential account
                        await prisma.account.create({
                            data: {
                                userId: adminUser.id,
                                accountId: requestedEmail,
                                providerId: "credential",
                                password: hashedPassword
                            }
                        });

                        console.log("✅ New credential account created with requested password");
                    }

                } catch (updateError: any) {
                    console.log("❌ Failed to update password:", updateError?.message);
                }
            }

            // Ensure admin role
            const hasAdminRole = adminUser.tenantUsers.some(
                tu => tu.role.name.toLowerCase() === 'admin'
            );

            if (!hasAdminRole) {
                console.log(`\n🔧 Assigning admin role...`);

                // Find default tenant and admin role
                const defaultTenant = await prisma.tenant.findFirst({
                    where: { code: 'default-organization' }
                });

                const adminRole = await prisma.role.findFirst({
                    where: {
                        name: 'Admin',
                        tenantId: defaultTenant?.id
                    }
                });

                if (defaultTenant && adminRole) {
                    await prisma.tenantUser.create({
                        data: {
                            userId: adminUser.id,
                            tenantId: defaultTenant.id,
                            roleId: adminRole.id
                        }
                    });

                    console.log("✅ Admin role assigned");
                } else {
                    console.log("❌ Could not find default tenant or admin role");
                }
            } else {
                console.log("✅ User already has admin role");
            }
        }

        // Final verification
        console.log(`\n📋 Final Verification:`);

        const finalUser = await prisma.user.findUnique({
            where: { email: requestedEmail },
            include: {
                tenantUsers: {
                    include: {
                        role: true,
                        tenant: true
                    }
                }
            }
        });

        if (finalUser) {
            console.log(`✅ User exists: ${finalUser.email}`);
            console.log(`✅ Name: ${finalUser.name}`);
            console.log(`✅ Email verified: ${finalUser.emailVerified ? 'Yes' : 'No'}`);

            const adminRoles = finalUser.tenantUsers.filter(
                tu => tu.role.name.toLowerCase() === 'admin'
            );

            console.log(`✅ Admin roles: ${adminRoles.length}`);
            adminRoles.forEach((tu, i) => {
                console.log(`   ${i + 1}. ${tu.tenant.name} (${tu.tenant.code}) - ${tu.role.name}`);
            });

            // Test final login
            try {
                const { auth } = await import("@GCMC-KAJ/auth");
                await auth.api.signInEmail({
                    body: {
                        email: requestedEmail,
                        password: requestedPassword
                    }
                });

                console.log("✅ Final login test: SUCCESS");
            } catch {
                console.log("❌ Final login test: FAILED");
            }
        }

        console.log(`\n🎉 Admin user setup complete!`);
        console.log(`   📧 Email: ${requestedEmail}`);
        console.log(`   🔑 Password: ${requestedPassword}`);
        console.log(`   👤 Role: admin`);

    } catch (error) {
        console.error("❌ Verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAdminCredentials().catch(console.error);