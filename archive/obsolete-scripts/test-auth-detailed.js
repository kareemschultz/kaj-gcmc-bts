#!/usr/bin/env node

// Test authentication flow for Better Auth integration with proper cookie handling
const API_URL = 'http://localhost:3003';
const WEB_URL = 'http://localhost:3001';
const TEST_EMAIL = 'admin@gcmc-kaj.com';
const TEST_PASSWORD = 'AdminPassword123';

async function testAuthWithCookies() {
  console.log('🧪 Testing authentication flow with proper cookie handling...\n');

  try {
    // Test 1: Sign in and capture all cookies
    console.log('1. Testing sign-in with cookie capture...');
    const signInResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': WEB_URL,
        'Referer': WEB_URL,
      },
      credentials: 'include',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    console.log('Sign-in response status:', signInResponse.status);
    const signInData = await signInResponse.json();
    console.log('Sign-in response data:', JSON.stringify(signInData, null, 2));

    // Capture ALL cookies from set-cookie headers
    const setCookieHeaders = signInResponse.headers.get('set-cookie');
    console.log('Set-Cookie headers:', setCookieHeaders);

    if (!signInResponse.ok) {
      console.log('❌ Sign-in failed');
      return;
    }
    console.log('✅ Sign-in successful\n');

    // Test 2: Get session with captured cookies
    console.log('2. Testing session retrieval...');
    const sessionResponse = await fetch(`${API_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Origin': WEB_URL,
        'Referer': WEB_URL,
        ...(setCookieHeaders ? { 'Cookie': setCookieHeaders } : {})
      },
      credentials: 'include'
    });

    console.log('Session response status:', sessionResponse.status);
    const sessionData = await sessionResponse.text();
    console.log('Session response data:', sessionData);

    if (sessionResponse.ok && sessionData && sessionData !== 'null') {
      console.log('✅ Session retrieval successful');
    } else {
      console.log('❌ Session retrieval failed or returned null');
    }
    console.log('');

    // Test 3: Test tRPC auth endpoint
    console.log('3. Testing tRPC auth endpoint...');
    const trpcResponse = await fetch(`${API_URL}/trpc/auth.getSession`, {
      method: 'GET',
      headers: {
        'Origin': WEB_URL,
        'Referer': WEB_URL,
        ...(setCookieHeaders ? { 'Cookie': setCookieHeaders } : {})
      },
      credentials: 'include'
    });

    console.log('tRPC response status:', trpcResponse.status);
    const trpcData = await trpcResponse.text();
    console.log('tRPC response data:', trpcData);

    if (trpcResponse.ok) {
      console.log('✅ tRPC auth endpoint accessible');
    } else {
      console.log('❌ tRPC auth endpoint failed');
    }
    console.log('');

    // Test 4: Try accessing a protected endpoint
    console.log('4. Testing protected endpoint...');
    const protectedResponse = await fetch(`${API_URL}/trpc/privateData`, {
      method: 'GET',
      headers: {
        'Origin': WEB_URL,
        'Referer': WEB_URL,
        ...(setCookieHeaders ? { 'Cookie': setCookieHeaders } : {})
      },
      credentials: 'include'
    });

    console.log('Protected endpoint response status:', protectedResponse.status);
    const protectedData = await protectedResponse.text();
    console.log('Protected endpoint response:', protectedData);

    if (protectedResponse.ok) {
      console.log('✅ Protected endpoint accessible');
    } else {
      console.log('❌ Protected endpoint failed');
    }

    // Test 5: Test available Better Auth endpoints
    console.log('\n5. Testing available Better Auth endpoints...');
    const endpoints = [
      '/api/auth/list-sessions',
      '/api/auth/revoke-session',
      '/api/auth/sign-out'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Origin': WEB_URL,
            ...(setCookieHeaders ? { 'Cookie': setCookieHeaders } : {})
          },
          credentials: 'include'
        });
        console.log(`${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthWithCookies();