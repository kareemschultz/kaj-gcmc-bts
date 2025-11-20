const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:postgres@localhost:5432/gcmc_kaj'
      }
    }
  });

  try {
    console.log('🔍 Checking users in database...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        emailVerified: true,
      }
    });

    console.log('👥 Users found:', users.length);
    for (const user of users) {
      console.log(`  - ${user.email} (ID: ${user.id}) - Verified: ${user.emailVerified} - Created: ${user.createdAt}`);
    }

    // Check for admin user specifically
    const adminUser = await prisma.user.findFirst({
      where: {
        email: {
          in: ['admin@test.gcmc.com', 'admin@gcmc-kaj.com', 'admin@gcmc.com']
        }
      }
    });

    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email);
    } else {
      console.log('❌ No admin user found with expected emails');
    }

    // Check accounts table for OAuth/auth info
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        providerId: true,
      }
    });

    console.log('🔑 Accounts found:', accounts.length);
    for (const account of accounts) {
      console.log(`  - User ID: ${account.userId}, Provider: ${account.providerId}`);
    }

    // Check sessions
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        userId: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('🎫 Recent sessions:', sessions.length);
    for (const session of sessions) {
      console.log(`  - User ID: ${session.userId}, Created: ${session.createdAt}, Expires: ${session.expiresAt}`);
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();