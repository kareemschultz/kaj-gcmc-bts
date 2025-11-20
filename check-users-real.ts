import prisma from '@GCMC-KAJ/db';

async function checkUsers() {

  try {
    console.log('🔍 Checking all users in database...');

    // Check Better Auth users table
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    console.log('\n👥 Found users:', users);

    // Check Better Auth accounts (passwords)
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        providerId: true,
        accountId: true,
        password: true,
      }
    });

    console.log('\n🔐 Found accounts:', accounts);

    // Check if the specific admin user exists
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@test.gcmc.com'
      },
      include: {
        accounts: true
      }
    });

    console.log('\n🔍 Admin user check:', adminUser);

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();