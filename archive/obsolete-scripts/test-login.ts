#!/usr/bin/env bun

async function testLogin() {
  console.log('🔐 Testing login functionality...');

  const credentials = {
    email: 'admin@test.gcmc.com',
    password: 'TestPassword123!'
  };

  try {
    console.log('📤 Sending login request to:', 'http://localhost:3003/api/auth/sign-in/email');
    console.log('📝 Credentials:', { email: credentials.email, password: '[REDACTED]' });

    const response = await fetch('http://localhost:3003/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Login successful!');
        console.log('🔑 Session token:', data.token || 'No token in response');
        console.log('👤 User:', data.user);
      } catch (e) {
        console.log('✅ Login successful (non-JSON response)');
      }
    } else {
      console.error('❌ Login failed:', responseText);
    }

  } catch (error) {
    console.error('❌ Request error:', error);
  }
}

testLogin();