const { chromium } = require('playwright');

async function debugAuthGuardIssue() {
  console.log('🔍 Debugging AuthGuard component session processing...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Capture all console logs from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('AuthGuard') || text.includes('Session') || text.includes('✅') || text.includes('❌')) {
      console.log(`🖥️ BROWSER: ${text}`);
    }
  });

  try {
    console.log('\n1️⃣ Login first to establish session...');
    await page.goto('http://localhost:3001/login');

    // Login using the form
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('\n2️⃣ Testing session data directly before AuthGuard...');

    const directSessionTest = await page.evaluate(async () => {
      try {
        // Import the authClient exactly like AuthGuard does
        const { authClient } = await import('/src/lib/auth-client.ts');

        console.log('🔧 AuthGuard Debug: About to call authClient.getSession()...');
        const session = await authClient.getSession();

        console.log('📦 AuthGuard Debug: Raw session response:', session);
        console.log('👤 AuthGuard Debug: Session user:', session?.user);
        console.log('📧 AuthGuard Debug: User email:', session?.user?.email);

        // Test the exact logic from AuthGuard
        const authenticated = !!(session?.user);
        console.log('🔐 AuthGuard Debug: Authentication check result:', authenticated);

        return {
          rawSession: session,
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          authenticated: authenticated,
          sessionKeys: session ? Object.keys(session) : [],
          userKeys: session?.user ? Object.keys(session.user) : []
        };
      } catch (error) {
        console.error('❌ AuthGuard Debug: Error in session check:', error);
        return {
          error: error.message,
          stack: error.stack
        };
      }
    });

    console.log('\n📊 Direct AuthGuard Logic Test Results:');
    console.log('='.repeat(50));
    console.log('Has session:', directSessionTest.hasSession);
    console.log('Has user:', directSessionTest.hasUser);
    console.log('User email:', directSessionTest.userEmail);
    console.log('Authenticated:', directSessionTest.authenticated);
    console.log('Session keys:', directSessionTest.sessionKeys);
    console.log('User keys:', directSessionTest.userKeys);

    if (directSessionTest.error) {
      console.log('❌ Error:', directSessionTest.error);
    }

    console.log('\n3️⃣ Now testing actual AuthGuard component behavior...');

    // Navigate to dashboard to trigger AuthGuard
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(5000); // Give AuthGuard time to process

    const finalUrl = page.url();
    console.log(`🌐 Final URL after AuthGuard: ${finalUrl}`);

    if (finalUrl.includes('dashboard')) {
      console.log('✅ AuthGuard allowed access to dashboard');
    } else if (finalUrl.includes('login')) {
      console.log('❌ AuthGuard redirected to login');

      console.log('\n4️⃣ Checking if there\'s a timing issue...');

      // Test if it's a timing issue by waiting longer
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForTimeout(8000); // Wait longer

      const secondUrl = page.url();
      console.log(`🌐 URL after longer wait: ${secondUrl}`);

      if (secondUrl.includes('dashboard')) {
        console.log('⏰ TIMING ISSUE: AuthGuard works with longer wait');
      } else {
        console.log('🔄 Still redirecting - issue is not timing related');
      }
    }

    console.log('\n5️⃣ Final comprehensive session test...');

    const finalSessionTest = await page.evaluate(async () => {
      // Test both methods side by side
      const results = {};

      try {
        // Method 1: Direct fetch (known to work)
        console.log('Testing direct fetch...');
        const directResponse = await fetch('http://localhost:3003/api/auth/get-session', {
          credentials: 'include'
        });
        const directData = await directResponse.json();
        results.direct = {
          hasUser: !!directData?.user,
          userEmail: directData?.user?.email,
          data: directData
        };
        console.log('Direct fetch result:', results.direct.hasUser);

      } catch (error) {
        results.direct = { error: error.message };
      }

      try {
        // Method 2: AuthClient (used by AuthGuard)
        console.log('Testing authClient...');
        const { authClient } = await import('/src/lib/auth-client.ts');
        const authData = await authClient.getSession();
        results.authClient = {
          hasUser: !!authData?.user,
          userEmail: authData?.user?.email,
          data: authData
        };
        console.log('AuthClient result:', results.authClient.hasUser);

      } catch (error) {
        results.authClient = { error: error.message };
      }

      return results;
    });

    console.log('\n📋 Final Comparison:');
    console.log('Direct API - Has User:', finalSessionTest.direct?.hasUser || 'ERROR');
    console.log('AuthClient - Has User:', finalSessionTest.authClient?.hasUser || 'ERROR');
    console.log('Direct API - Email:', finalSessionTest.direct?.userEmail || 'N/A');
    console.log('AuthClient - Email:', finalSessionTest.authClient?.userEmail || 'N/A');

    if (finalSessionTest.direct?.hasUser && !finalSessionTest.authClient?.hasUser) {
      console.log('\n❌ FOUND THE BUG: AuthClient returns different data than direct API!');
    } else if (finalSessionTest.authClient?.hasUser && finalUrl.includes('login')) {
      console.log('\n❌ FOUND THE BUG: AuthClient returns valid data but AuthGuard still redirects!');
      console.log('   This suggests an issue in the AuthGuard component logic itself.');
    } else if (finalSessionTest.authClient?.hasUser && finalUrl.includes('dashboard')) {
      console.log('\n✅ SUCCESS: AuthGuard is working correctly!');
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugAuthGuardIssue();