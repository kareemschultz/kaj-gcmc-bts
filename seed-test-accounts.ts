#!/usr/bin/env bun

import { seedTestDatabase } from "./tests/utils/seed-database";

async function main() {
	console.log("🚀 Starting test account seeding...");
	try {
		await seedTestDatabase();
		console.log("\n✅ Test accounts created successfully!");
		console.log("\n📝 You can now login with these accounts:");
		console.log("-------------------------------------------");
		console.log("👤 Admin Account:");
		console.log("   Email: admin@test.gcmc.com");
		console.log("   Password: TestPassword123!");
		console.log("   Role: Administrator");
		console.log("");
		console.log("👤 Regular User Account:");
		console.log("   Email: user@test.gcmc.com");
		console.log("   Password: TestPassword123!");
		console.log("   Role: Member");
		console.log("");
		console.log("👤 Client Account:");
		console.log("   Email: client@test.gcmc.com");
		console.log("   Password: TestPassword123!");
		console.log("   Role: Client");
		console.log("-------------------------------------------");
		console.log("\n🌐 Login at: http://localhost:3001/login");
	} catch (error) {
		console.error("❌ Failed to seed test accounts:", error);
		process.exit(1);
	}
}

main();
