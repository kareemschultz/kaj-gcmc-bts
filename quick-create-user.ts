#!/usr/bin/env bun

// Quick script to create a demo user directly in the database
import { PrismaClient } from "./packages/db/prisma/generated/index.js";

const prisma = new PrismaClient();

async function createDemoUser() {
    try {
        console.log("🚀 Creating demo user...");

        // Create a simple user - Better Auth will handle password creation
        const user = await prisma.user.upsert({
            where: { email: "demo@gcmc.com" },
            update: {},
            create: {
                name: "Demo User",
                email: "demo@gcmc.com",
                emailVerified: true,
            },
        });

        console.log("✅ Demo user created:", user.email);
        console.log("\n🔐 Demo Account:");
        console.log("   Email: demo@gcmc.com");
        console.log("   Note: You'll need to use Better Auth's password reset or register function");
        console.log("\n📝 Alternative - Use the test data from the app:");
        console.log("   Try visiting http://localhost:3001/login");
        console.log("   The app should have Better Auth endpoints working");
        console.log("\n🌐 Platform URL: http://localhost:3001");

    } catch (error) {
        console.error("❌ Failed to create demo user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createDemoUser();