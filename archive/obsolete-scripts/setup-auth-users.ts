#!/usr/bin/env bun

/**
 * Script to register test users through Better Auth API
 * This ensures users are created with proper authentication setup
 */

async function registerUser(email: string, password: string, name: string) {
  try {
    console.log(`📝 Registering user: ${email}`);

    const response = await fetch('http://localhost:3003/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to register ${email}: ${response.status} - ${errorText}`);

      // Try to login if user already exists
      console.log(`🔄 Attempting to login existing user: ${email}`);
      const loginResponse = await fetch('http://localhost:3003/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (loginResponse.ok) {
        console.log(`✅ User ${email} already exists and can login`);
        return true;
      } else {
        const loginError = await loginResponse.text();
        console.error(`❌ Login failed: ${loginError}`);
        return false;
      }
    }

    const data = await response.json();
    console.log(`✅ Successfully registered: ${email}`, data);
    return true;
  } catch (error) {
    console.error(`❌ Error registering ${email}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up Better Auth test users...');
  console.log('⏳ Waiting for server to be ready...');

  // Wait a bit for the server to be fully ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test users to create
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

  let successCount = 0;

  for (const user of users) {
    const success = await registerUser(user.email, user.password, user.name);
    if (success) successCount++;
  }

  console.log(`\n📊 Summary: ${successCount}/${users.length} users ready`);

  if (successCount === users.length) {
    console.log('🎉 All test users are ready for authentication!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@test.gcmc.com / TestPassword123!');
    console.log('User: user@test.gcmc.com / UserPassword123!');
  } else {
    console.log('⚠️ Some users could not be set up. Check the errors above.');
  }
}

// Run the script
main().catch(console.error);