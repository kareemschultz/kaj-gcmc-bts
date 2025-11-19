#!/usr/bin/env bun

import bcrypt from "bcryptjs";
import prisma from "./packages/db/src/index.ts";

async function createTestUser() {
	console.log("🚀 Creating admin user...");

	try {
		// Check if user exists
		let user = await prisma.user.findUnique({
			where: { email: "admin@gcmc-kaj.com" },
		});

		if (!user) {
			// Create user
			user = await prisma.user.create({
				data: {
					email: "admin@gcmc-kaj.com",
					name: "Admin User",
					emailVerified: new Date(),
				},
			});
			console.log("✅ User created:", user.id);
		} else {
			console.log("✅ User exists:", user.id);
		}

		// Create account for Better Auth
		try {
			const hashedPassword = await bcrypt.hash("Admin123!@#", 12);
			const account = await prisma.account.create({
				data: {
					userId: user.id,
					accountId: user.id,
					providerId: "email",
					password: hashedPassword,
				},
			});
			console.log("✅ Account created for user");
		} catch (e: any) {
			console.log("Account may already exist:", e.message);
		}
	} catch (error) {
		console.error("❌ Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

createTestUser();
