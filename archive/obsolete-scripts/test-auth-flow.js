#!/usr/bin/env node

// Test authentication flow for Better Auth integration
const API_URL = 'http://localhost:3003';
const WEB_URL = 'http://localhost:3001';
const TEST_EMAIL = 'admin@gcmc-kaj.com';
const TEST_PASSWORD = 'AdminPassword123';

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...\n');

  let sessionCookies = [];

  try {
    // Test 1: Health Check
    console.log('1. Testing server health...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    console.log('✅ Server is healthy\n');

    // Test 2: Auth endpoint accessibility
    console.log('2. Testing auth endpoint accessibility...');
    const authResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'OPTIONS',
      headers: {
        'Origin': WEB_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('Auth endpoint response:', authResponse.status);
    console.log('CORS headers:', Object.fromEntries([...authResponse.headers.entries()]));
    console.log('✅ Auth endpoint is accessible\n');

    // Test 3: Get CSRF token
    console.log('3. Getting CSRF token...');
    const csrfResponse = await fetch(`${API_URL}/api/auth/csrf`, {
      method: 'GET',
      headers: {
        'Origin': WEB_URL,
        'Referer': WEB_URL
      },
      credentials: 'include'
    });

    if (!csrfResponse.ok) {
      console.log('⚠️  CSRF endpoint not available, continuing without CSRF token');
    } else {
      const csrfCookies = csrfResponse.headers.get('set-cookie');
      if (csrfCookies) {
        sessionCookies.push(csrfCookies);
        console.log('✅ CSRF token obtained');
      }
    }
    console.log('');

    // Test 4: Sign in attempt
    console.log('4. Testing sign-in...');
    const signInResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': WEB_URL,
        'Referer': WEB_URL,
        ...(sessionCookies.length > 0 ? { 'Cookie': sessionCookies.join('; ') } : {})
      },
      credentials: 'include',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    console.log('Sign-in response status:', signInResponse.status);
    const signInData = await signInResponse.text();
    console.log('Sign-in response:', signInData);

    if (signInResponse.ok) {
      // Capture session cookies
      const cookies = signInResponse.headers.get('set-cookie');
      if (cookies) {
        sessionCookies = [cookies];
        console.log('✅ Sign-in successful, session cookies received');
      }
    } else {
      console.log('❌ Sign-in failed');
      return;
    }
    console.log('');

    // Test 5: Session verification
    console.log('5. Testing session verification...');
    const sessionResponse = await fetch(`${API_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Origin': WEB_URL,
        'Referer': WEB_URL,
        'Cookie': sessionCookies.join('; ')
      },
      credentials: 'include'
    });

    console.log('Session response status:', sessionResponse.status);
    const sessionData = await sessionResponse.text();
    console.log('Session data:', sessionData);

    if (sessionResponse.ok) {
      console.log('✅ Session verification successful');
    } else {
      console.log('❌ Session verification failed');
    }
    console.log('');

    // Test 6: tRPC endpoint with authentication
    console.log('6. Testing tRPC endpoint with authentication...');
    const trpcResponse = await fetch(`${API_URL}/trpc/auth.getSession`, {
      method: 'GET',
      headers: {
        'Origin': WEB_URL,
        'Referer': WEB_URL,
        'Cookie': sessionCookies.join('; ')
      },
      credentials: 'include'
    });

    console.log('tRPC response status:', trpcResponse.status);
    const trpcData = await trpcResponse.text();
    console.log('tRPC response:', trpcData);

    if (trpcResponse.ok) {
      console.log('✅ tRPC authentication successful');
    } else {
      console.log('❌ tRPC authentication failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow();