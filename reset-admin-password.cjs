#!/usr/bin/env node
require("dotenv").config();
const { PrismaClient } = require("./packages/db/prisma/generated/index.js");

async function hashPassword(password) {
	const bcrypt = require("bcryptjs");
	const saltRounds = 12;
	return bcrypt.hash(password, saltRounds);
}

async function resetAdminPassword() {
	const prisma = new PrismaClient();

	try {
		console.log("🔍 Resetting admin password...");

		// Find the admin user
		const adminUser = await prisma.user.findUnique({
			where: { email: "admin@gcmc-kaj.com" },
		});

		if (!adminUser) {
			console.log("❌ Admin user not found");
			return;
		}

		console.log("✅ Admin user found:", adminUser.email);

		// Hash the password using bcrypt
		const hashedPassword = await hashPassword("SuperAdminPassword123!");

		// Find existing account for credential provider
		const existingAccount = await prisma.account.findFirst({
			where: {
				userId: adminUser.id,
				providerId: "credential",
			},
		});

		if (existingAccount) {
			// Update existing account
			await prisma.account.update({
				where: { id: existingAccount.id },
				data: { password: hashedPassword },
			});
		} else {
			// Create new account
			await prisma.account.create({
				data: {
					userId: adminUser.id,
					providerId: "credential",
					accountId: adminUser.id,
					password: hashedPassword,
				},
			});
		}

		console.log("✅ Admin password updated successfully");
		console.log("📝 Credentials:");
		console.log("   Email: admin@gcmc-kaj.com");
		console.log("   Password: SuperAdminPassword123!");
	} catch (error) {
		console.error("❌ Failed to reset admin password:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

resetAdminPassword();
