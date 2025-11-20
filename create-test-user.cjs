// Simple test user creation script using direct database calls
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Creating test user...');

        // First check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email: 'admin@test.gcmc.com' }
        });

        if (existing) {
            console.log('✅ User already exists:', existing.email);
            return existing;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('TestPassword123!', 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: 'admin@test.gcmc.com',
                name: 'Test Admin',
                emailVerified: new Date(), // Mark as verified
            }
        });

        // Create account record for Better Auth
        await prisma.account.create({
            data: {
                userId: user.id,
                accountId: user.id,
                providerId: 'credential',
                accessToken: hashedPassword, // Store hashed password as access token
            }
        });

        console.log('✅ Test user created successfully:', user.email);
        return user;

    } catch (error) {
        console.error('❌ Error creating test user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser().catch(console.error);