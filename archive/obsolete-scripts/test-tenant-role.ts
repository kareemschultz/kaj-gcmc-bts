import { getUserTenantRole } from '@GCMC-KAJ/auth';
import prisma from '@GCMC-KAJ/db';

async function testTenantRole() {
  console.log('🔍 Testing getUserTenantRole function...');

  try {
    // Find our test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@test.gcmc.com' }
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('✅ Test user found:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name
    });

    // Test the getUserTenantRole function
    console.log('🔍 Testing getUserTenantRole...');
    const tenantRole = await getUserTenantRole(testUser.id);

    if (tenantRole) {
      console.log('✅ getUserTenantRole SUCCESS:', {
        tenantId: tenantRole.tenantId,
        role: tenantRole.role,
        tenant: tenantRole.tenant
      });
    } else {
      console.log('❌ getUserTenantRole returned null');

      // Let's check the TenantUser table directly
      console.log('🔍 Checking TenantUser table directly...');
      const tenantUsers = await prisma.tenantUser.findMany({
        where: { userId: testUser.id },
        include: {
          role: true,
          tenant: true
        }
      });

      console.log('📊 TenantUser records:', tenantUsers);
    }

  } catch (error) {
    console.error('❌ Error testing tenant role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTenantRole().catch(console.error);