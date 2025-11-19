#!/usr/bin/env bun

import prisma from '@GCMC-KAJ/db';

async function cleanupAndRegisterUsers() {
  try {
    console.log('🧹 Cleaning up existing test users...');

    // Delete existing test users from the database
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@test.gcmc.com', 'user@test.gcmc.com']
        }
      }
    });

    console.log('✅ Cleanup complete');

    // Now register new users through Better Auth API
    console.log('\n🚀 Registering new test users through Better Auth...');

    const users = [
      {
        email: 'admin@test.gcmc.com',
        password: 'TestPassword123!',
        name: 'Test Admin User'
      },
      {
        email: 'user@test.gcmc.com',
        password: 'UserPassword123!',
        name: 'Test Regular User'
      }
    ];

    for (const user of users) {
      console.log(`📝 Registering: ${user.email}`);

      const response = await fetch('http://localhost:3003/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Successfully registered: ${user.email}`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to register ${user.email}: ${error}`);
      }
    }

    console.log('\n🎉 Setup complete! You can now login with:');
    console.log('Admin: admin@test.gcmc.com / TestPassword123!');
    console.log('User: user@test.gcmc.com / UserPassword123!');

  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAndRegisterUsers();