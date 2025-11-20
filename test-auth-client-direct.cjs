// Test the auth client directly to see what's happening with the callbacks
const { chromium } = require('playwright');

async function testAuthClientDirect() {
  console.log('🧪 Testing auth client callback behavior...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    console.log(`🖥️ BROWSER: [${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('\n1️⃣ Loading login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

    console.log('\n2️⃣ Injecting debug script...');

    // Inject a script to test the auth client directly
    await page.evaluate(async () => {
      console.log('🔬 Testing auth client behavior directly...');

      // First check if the auth client is available
      try {
        // Wait for authClient to be available (it might be loaded asynchronously)
        let authClient;
        let attempts = 0;
        while (!authClient && attempts < 50) {
          try {
            authClient = window.authClient || (await window.authClientPromise);
            if (authClient) break;
          } catch (e) {
            // Try to access from the global scope or modules
            if (window.__NEXT_DATA__ || window.next) {
              // Next.js app is loaded, try to access React context
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!authClient) {
          console.log('❌ Auth client not found on window. Trying to call sign in directly...');

          // Try to call the API directly
          const response = await fetch('http://localhost:3003/api/auth/sign-in/email', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'email=admin@test.gcmc.com&password=TestPassword123!'
          });

          const result = await response.json();
          console.log('📡 Direct API response:', result);

          if (response.ok && result.user) {
            console.log('✅ Direct API call succeeded! User:', result.user.email);
            console.log('🎯 Session token should be set as cookie');

            // Check if we can now get session
            const sessionResponse = await fetch('http://localhost:3003/api/auth/get-session', {
              credentials: 'include'
            });
            const session = await sessionResponse.json();
            console.log('🔑 Session check after login:', session);

            if (session.user) {
              console.log('✅ Session is valid! Login worked!');
              console.log('🚀 Should redirect to dashboard now...');
              window.location.href = '/dashboard';
            } else {
              console.log('❌ Session not found after successful login');
            }
          } else {
            console.log('❌ Direct API call failed:', result);
          }
        } else {
          console.log('✅ Auth client found:', typeof authClient);

          // Test auth client with both callback and promise approaches
          console.log('🧪 Testing auth client signIn...');

          try {
            const result = await authClient.signIn.email({
              email: 'admin@test.gcmc.com',
              password: 'TestPassword123!'
            });

            console.log('📊 Auth client result:', result);

            if (result && result.data && result.data.user) {
              console.log('✅ Auth client succeeded!', result.data.user.email);
              window.location.href = '/dashboard';
            } else if (result && result.error) {
              console.log('❌ Auth client error:', result.error);
            } else {
              console.log('⚠️ Unexpected auth client result format');
            }
          } catch (authError) {
            console.log('💥 Auth client threw error:', authError);
          }
        }

      } catch (error) {
        console.log('💥 Debug script error:', error);
      }
    });

    // Wait for the script to complete
    await page.waitForTimeout(5000);

    console.log('\n3️⃣ Checking final state...');
    const finalUrl = page.url();
    console.log(`🌐 Final URL: ${finalUrl}`);

    if (finalUrl.includes('dashboard')) {
      console.log('🎉 SUCCESS! Redirected to dashboard');
    } else {
      console.log('❌ Still on login page');
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    await browser.close();
  }
}

testAuthClientDirect();