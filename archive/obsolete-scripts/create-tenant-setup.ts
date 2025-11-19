import prisma from '@GCMC-KAJ/db';

async function createTenantSetup() {
  console.log('🏢 Setting up tenant environment for test user...');

  try {
    // First, let's check if the test user exists
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@test.gcmc.com' }
    });

    if (!testUser) {
      console.log('❌ Test user not found. Please create the user first.');
      return;
    }

    console.log('✅ Test user found:', testUser.email);

    // Create a test tenant
    console.log('🏢 Creating test tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        name: 'GCMC Test Company',
        code: 'GCMC-TEST',
        contactInfo: {
          email: 'admin@test.gcmc.com',
          phone: '+1-555-0123',
          address: '123 Business District, City, State 12345'
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          features: ['tax_services', 'compliance', 'analytics']
        }
      }
    });

    console.log('✅ Tenant created:', tenant.name, `(ID: ${tenant.id})`);

    // Create admin role for the tenant
    console.log('👤 Creating admin role...');
    const adminRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Administrator',
        description: 'Full administrative access to all platform features'
      }
    });

    console.log('✅ Admin role created:', adminRole.name, `(ID: ${adminRole.id})`);

    // Create permissions for the admin role (simplified for demo)
    console.log('🔐 Creating permissions...');
    const permissions = await prisma.permission.createMany({
      data: [
        {
          roleId: adminRole.id,
          module: 'dashboard',
          action: 'read',
          allowed: true
        },
        {
          roleId: adminRole.id,
          module: 'dashboard',
          action: 'write',
          allowed: true
        },
        {
          roleId: adminRole.id,
          module: 'users',
          action: 'manage',
          allowed: true
        },
        {
          roleId: adminRole.id,
          module: 'clients',
          action: 'manage',
          allowed: true
        },
        {
          roleId: adminRole.id,
          module: 'notifications',
          action: 'read',
          allowed: true
        },
        {
          roleId: adminRole.id,
          module: 'analytics',
          action: 'read',
          allowed: true
        }
      ]
    });

    console.log(`✅ Created ${permissions.count} permissions`);

    // Associate user with tenant and role
    console.log('🔗 Associating user with tenant...');
    const tenantUser = await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: testUser.id,
        roleId: adminRole.id
      }
    });

    console.log('✅ User associated with tenant:', {
      userId: tenantUser.userId,
      tenantId: tenantUser.tenantId,
      roleId: tenantUser.roleId
    });

    // Verify the setup
    console.log('🔍 Verifying tenant setup...');
    const userWithTenant = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        tenantUsers: {
          include: {
            tenant: true,
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (userWithTenant?.tenantUsers.length) {
      const tenantAssignment = userWithTenant.tenantUsers[0];
      console.log('✅ Setup verified successfully!');
      console.log('📊 User tenant assignment:');
      console.log(`   - Tenant: ${tenantAssignment.tenant.name} (${tenantAssignment.tenant.code})`);
      console.log(`   - Role: ${tenantAssignment.role.name}`);
      console.log(`   - Permissions: ${tenantAssignment.role.permissions.length} granted`);

      console.log('\n🎉 Tenant setup complete!');
      console.log('🔐 Test credentials:');
      console.log('   Email: admin@test.gcmc.com');
      console.log('   Password: TestPassword123!');
      console.log('   Tenant: GCMC Test Company');
      console.log('   Role: Administrator');
    } else {
      console.log('❌ Setup verification failed');
    }

  } catch (error) {
    console.error('❌ Error setting up tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTenantSetup().catch(console.error);