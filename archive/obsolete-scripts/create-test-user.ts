import prisma from '@GCMC-KAJ/db';
import { hash } from 'bcryptjs';

async function createTestUser() {
  try {
    console.log('🚀 Creating test user for E2E tests...');

    // Check if test user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@test.gcmc.com' }
    });

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return existingUser;
    }

    // Hash password for the test user
    const hashedPassword = await hash('TestPassword123!', 10);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Admin User',
        email: 'admin@test.gcmc.com',
        emailVerified: true,
        phone: '+592-123-4567',
        accounts: {
          create: {
            accountId: 'test-admin-account',
            providerId: 'credential',
            password: hashedPassword,
          }
        }
      }
    });

    console.log('✅ Test user created successfully:', testUser.email);

    // Also create a second test user for various scenarios
    const existingUser2 = await prisma.user.findUnique({
      where: { email: 'user@test.gcmc.com' }
    });

    if (!existingUser2) {
      const hashedPassword2 = await hash('UserPassword123!', 10);

      const testUser2 = await prisma.user.create({
        data: {
          name: 'Test Regular User',
          email: 'user@test.gcmc.com',
          emailVerified: true,
          phone: '+592-987-6543',
          accounts: {
            create: {
              accountId: 'test-user-account',
              providerId: 'credential',
              password: hashedPassword2,
            }
          }
        }
      });

      console.log('✅ Regular test user created successfully:', testUser2.email);
    }

    return testUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('🎉 Test users setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to setup test users:', error);
      process.exit(1);
    });
}

export { createTestUser };