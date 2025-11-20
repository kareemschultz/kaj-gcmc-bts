const { chromium } = require('playwright');

async function debugBetterAuthResponse() {
  console.log('🔍 Debugging Better Auth client response parsing...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Log everything
  page.on('console', msg => {
    console.log(`🖥️ BROWSER: ${msg.text()}`);
  });

  try {
    console.log('\n1️⃣ Login and go to dashboard page...');
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('\n2️⃣ Inspecting authClient.getSession() deeply...');

    const deepInspection = await page.evaluate(async () => {
      try {
        console.log('🔧 Starting deep inspection of authClient.getSession()...');

        // Import the authClient (this should work since AuthGuard loaded it)
        const authModule = await import('/apps/web/src/lib/auth-client.ts');
        const { authClient } = authModule;

        console.log('✅ Successfully imported authClient');

        // Test the session response step by step
        console.log('🧪 Testing authClient.getSession() internals...');

        // Step 1: Call getSession and capture the raw result
        console.log('📞 Calling authClient.getSession()...');
        const sessionResult = await authClient.getSession();

        console.log('📦 Raw authClient.getSession() result:', sessionResult);
        console.log('📦 typeof result:', typeof sessionResult);
        console.log('📦 Result keys:', sessionResult ? Object.keys(sessionResult) : 'null');

        // Step 2: Test what authClient thinks it's fetching
        console.log('🧪 Inspecting authClient internal configuration...');
        console.log('AuthClient baseURL:', authClient.baseURL);
        console.log('AuthClient basePath:', authClient.basePath);

        // Step 3: Make the exact same fetch that authClient would make
        const fullUrl = `${authClient.baseURL}${authClient.basePath}/get-session`;
        console.log('🌐 AuthClient would fetch:', fullUrl);

        const directFetch = await fetch(fullUrl, {
          credentials: 'include'
        });
        const directText = await directFetch.text();
        const directJson = JSON.parse(directText);

        console.log('📡 Direct fetch to authClient URL:', directText);

        // Step 4: Compare structures
        const comparison = {
          authClientResult: {
            raw: sessionResult,
            hasSession: !!sessionResult,
            hasUser: !!(sessionResult?.user),
            userEmail: sessionResult?.user?.email,
            sessionKeys: sessionResult ? Object.keys(sessionResult) : null,
            userKeys: sessionResult?.user ? Object.keys(sessionResult.user) : null
          },
          directFetch: {
            raw: directJson,
            hasSession: !!directJson,
            hasUser: !!(directJson?.user),
            userEmail: directJson?.user?.email,
            sessionKeys: directJson ? Object.keys(directJson) : null,
            userKeys: directJson?.user ? Object.keys(directJson.user) : null
          }
        };

        console.log('🔍 Detailed Comparison:', JSON.stringify(comparison, null, 2));

        return comparison;

      } catch (error) {
        console.error('❌ Deep inspection error:', error);
        return {
          error: error.message,
          stack: error.stack
        };
      }
    });

    console.log('\n📊 Deep Inspection Results:');
    console.log('='.repeat(60));

    if (deepInspection.error) {
      console.log('❌ Error:', deepInspection.error);
    } else {
      console.log('\n🔧 AuthClient Result:');
      console.log('  Has session:', deepInspection.authClientResult?.hasSession);
      console.log('  Has user:', deepInspection.authClientResult?.hasUser);
      console.log('  User email:', deepInspection.authClientResult?.userEmail);
      console.log('  Session keys:', deepInspection.authClientResult?.sessionKeys);
      console.log('  User keys:', deepInspection.authClientResult?.userKeys);

      console.log('\n📡 Direct Fetch Result:');
      console.log('  Has session:', deepInspection.directFetch?.hasSession);
      console.log('  Has user:', deepInspection.directFetch?.hasUser);
      console.log('  User email:', deepInspection.directFetch?.userEmail);
      console.log('  Session keys:', deepInspection.directFetch?.sessionKeys);
      console.log('  User keys:', deepInspection.directFetch?.userKeys);

      const keysMatch = JSON.stringify(deepInspection.authClientResult?.sessionKeys) ===
                       JSON.stringify(deepInspection.directFetch?.sessionKeys);
      const usersMatch = deepInspection.authClientResult?.hasUser === deepInspection.directFetch?.hasUser;

      console.log('\n🔍 Analysis:');
      console.log('  Session keys match:', keysMatch);
      console.log('  User detection matches:', usersMatch);

      if (!usersMatch) {
        console.log('\n❌ FOUND THE BUG!');
        console.log('AuthClient and direct fetch return different user detection results');
        console.log('This is a Better Auth React client parsing issue');
      } else {
        console.log('\n✅ Results match - issue might be elsewhere');
      }
    }

    console.log('\n3️⃣ Testing specific Better Auth configuration issue...');

    const configTest = await page.evaluate(async () => {
      try {
        // Test if the issue is with the authClient configuration
        const authModule = await import('/apps/web/src/lib/auth-client.ts');
        const { authClient } = authModule;

        // Check if NEXT_PUBLIC_SERVER_URL is properly set
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
        console.log('🔧 NEXT_PUBLIC_SERVER_URL:', serverUrl);

        // Test alternative authClient call patterns
        console.log('🧪 Testing alternative authClient patterns...');

        // Pattern 1: Direct session check
        const session1 = await authClient.getSession();
        console.log('Pattern 1 result:', !!session1?.user);

        // Pattern 2: Try to access session data differently
        const session2 = authClient.session;
        console.log('Pattern 2 (authClient.session):', session2);

        return {
          serverUrl,
          pattern1HasUser: !!(session1?.user),
          pattern1User: session1?.user?.email,
          pattern2: session2,
          pattern1Full: session1
        };

      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('\n🔧 Configuration Test Results:');
    if (configTest.error) {
      console.log('❌ Config test error:', configTest.error);
    } else {
      console.log('Server URL:', configTest.serverUrl);
      console.log('Pattern 1 has user:', configTest.pattern1HasUser);
      console.log('Pattern 1 user email:', configTest.pattern1User);
      console.log('Pattern 2 result:', configTest.pattern2);

      if (!configTest.pattern1HasUser) {
        console.log('\n❌ CONFIRMED: authClient.getSession() is not returning user data correctly');
      }
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugBetterAuthResponse();