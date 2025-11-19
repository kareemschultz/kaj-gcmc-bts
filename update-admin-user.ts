#!/usr/bin/env bun
/**
 * Update Admin User with New Password
 */

import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(moduleDir, ".env") });

import prisma from "@GCMC-KAJ/db";

async function updateAdminUser() {
	try {
		console.log("🔄 Updating admin user with new password...");

		const adminEmail = process.env.ADMIN_EMAIL || "admin@gcmc-kaj.com";
		const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123";

		console.log(`📧 Admin email: ${adminEmail}`);
		console.log(`🔑 New password: ${adminPassword}`);

		// Delete existing user and accounts
		console.log("🗑️  Deleting existing admin user...");

		const existingUser = await prisma.user.findUnique({
			where: { email: adminEmail },
			include: { accounts: true }
		});

		if (existingUser) {
			// Delete all accounts for this user
			await prisma.account.deleteMany({
				where: { userId: existingUser.id }
			});

			// Delete the user
			await prisma.user.delete({
				where: { id: existingUser.id }
			});

			console.log(`✅ Deleted existing user: ${existingUser.name} (${existingUser.id})`);
		} else {
			console.log("ℹ️  No existing user found");
		}

		console.log("✨ Admin user updated! You can now create a new user via the signup endpoint.");

	} catch (error) {
		console.error("❌ Error updating admin user:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

updateAdminUser().catch((error) => {
	console.error("💥 Failed to update admin user:", error);
	process.exit(1);
});