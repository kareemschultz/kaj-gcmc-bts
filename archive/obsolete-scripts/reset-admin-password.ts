#!/usr/bin/env bun

/**
 * Reset Admin Password to Match Login Form
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(moduleDir, ".env") });

import prisma from "@GCMC-KAJ/db";

// Hash the password using the same method Better Auth uses
async function hashPassword(password: string): Promise<string> {
	// Better Auth uses a simple salt:hash format
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hash = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hash));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	// Generate a simple salt
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const saltHex = Array.from(salt)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return `${saltHex}:${hashHex}`;
}

async function resetAdminPassword() {
	try {
		console.log("🔐 Resetting admin password to match login form...");

		const adminEmail = process.env.ADMIN_EMAIL || "admin@gcmc-kaj.com";
		const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123";

		console.log(`📧 Admin email: ${adminEmail}`);
		console.log(`🔑 Admin password: ${adminPassword}`);

		// Find the user
		const user = await prisma.user.findUnique({
			where: { email: adminEmail },
			include: { accounts: true },
		});

		if (!user) {
			throw new Error(`User with email ${adminEmail} not found`);
		}

		console.log(`✅ Found user: ${user.name} (${user._id})`);

		// Find the credential account
		const credentialAccount = user.accounts.find(
			(acc) => acc.providerId === "credential",
		);
		if (!credentialAccount) {
			throw new Error("No credential account found for user");
		}

		console.log(`✅ Found credential account: ${credentialAccount._id}`);

		// Hash the password
		const hashedPassword = await hashPassword(adminPassword);
		console.log(
			`🔐 Generated password hash: ${hashedPassword.substring(0, 20)}...`,
		);

		// Update the password
		await prisma.account.update({
			where: { _id: credentialAccount._id },
			data: { password: hashedPassword },
		});

		console.log("✅ Password updated successfully!");

		// Test the update
		const updatedAccount = await prisma.account.findUnique({
			where: { _id: credentialAccount._id },
		});

		console.log(
			`✅ Verified password hash updated: ${updatedAccount?.password?.substring(0, 20)}...`,
		);
		console.log(`🎉 Admin password has been reset to: ${adminPassword}`);
	} catch (error) {
		console.error("❌ Error resetting password:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

resetAdminPassword().catch((error) => {
	console.error("💥 Failed to reset admin password:", error);
	process.exit(1);
});
