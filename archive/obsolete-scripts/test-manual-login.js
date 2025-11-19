#!/usr/bin/env node

// Manual test of full login flow using Better Auth and frontend
const API_URL = 'http://localhost:3003';
const WEB_URL = 'http://localhost:3001';
const TEST_EMAIL = 'admin@gcmc-kaj.com';
const TEST_PASSWORD = 'AdminPassword123';

async function simulateLoginFlow() {
  console.log('🔐 Simulating complete login flow...\n');

  try {
    // Step 1: Get initial session (should be null)
    console.log('1. Checking initial session state...');
    const initialSession = await fetch(`${API_URL}/api/auth/get-session`, {
      credentials: 'include'
    });
    console.log('Initial session:', await initialSession.text());

    // Step 2: Attempt sign-in
    console.log('\n2. Performing sign-in...');
    const signInResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': WEB_URL,
      },
      credentials: 'include',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!signInResponse.ok) {
      throw new Error(`Sign-in failed: ${signInResponse.status}`);
    }

    const signInData = await signInResponse.json();
    console.log('Sign-in successful:', signInData);

    // Extract session cookies
    const cookies = signInResponse.headers.get('set-cookie');
    console.log('Received cookies:', cookies);

    // Step 3: Verify session after login
    console.log('\n3. Verifying authenticated session...');
    const authSessionResponse = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: {
        'Cookie': cookies
      },
      credentials: 'include'
    });

    if (authSessionResponse.ok) {
      const sessionData = await authSessionResponse.json();
      console.log('Authenticated session:', sessionData);

      if (sessionData.user) {
        console.log('✅ User authenticated successfully');
        console.log(`   User: ${sessionData.user.name} (${sessionData.user.email})`);
      } else {
        console.log('❌ Session exists but no user data');
      }
    } else {
      console.log('❌ Session verification failed');
    }

    // Step 4: Test tRPC context with authentication
    console.log('\n4. Testing tRPC with authentication...');
    const trpcResponse = await fetch(`${API_URL}/trpc/privateData`, {
      headers: {
        'Cookie': cookies
      },
      credentials: 'include'
    });

    if (trpcResponse.ok) {
      const trpcData = await trpcResponse.json();
      console.log('✅ tRPC authenticated successfully');
      console.log('tRPC response:', JSON.stringify(trpcData, null, 2));
    } else {
      console.log('❌ tRPC authentication failed:', await trpcResponse.text());
    }

    // Step 5: Test sign-out
    console.log('\n5. Testing sign-out...');
    const signOutResponse = await fetch(`${API_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        'Cookie': cookies
      },
      credentials: 'include'
    });

    console.log('Sign-out response status:', signOutResponse.status);

    // Step 6: Verify session is cleared
    console.log('\n6. Verifying session cleared...');
    const clearedSessionResponse = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: {
        'Cookie': cookies
      },
      credentials: 'include'
    });

    const clearedSessionData = await clearedSessionResponse.text();
    console.log('Session after sign-out:', clearedSessionData);

    if (clearedSessionData === 'null' || clearedSessionData.includes('"user":null')) {
      console.log('✅ Sign-out successful - session cleared');
    } else {
      console.log('❌ Sign-out may not have fully cleared the session');
    }

    console.log('\n🎉 Authentication flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the simulation
simulateLoginFlow();