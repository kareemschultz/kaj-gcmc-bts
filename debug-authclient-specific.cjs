const { chromium } = require('playwright');

async function debugAuthClientSpecific() {
  console.log('🔍 Debugging AuthClient configuration specifically...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Capture all console logs
  page.on('console', msg => {
    console.log(`🖥️ BROWSER: ${msg.text()}`);
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('auth') || request.url().includes('session')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('auth') || response.url().includes('session')) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('\n1️⃣ Login first...');
    await page.goto('http://localhost:3001/login');

    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('\n2️⃣ Testing authClient configuration in browser...');

    const authClientDiagnosis = await page.evaluate(async () => {
      try {
        // Check if authClient is accessible from window
        console.log('🔧 Checking window object for authClient...');
        console.log('Window keys:', Object.keys(window).filter(k => k.includes('auth')));

        // Try to access the authClient module directly
        console.log('🔧 Testing authClient import...');

        // Method 1: Try to access from global scope or window
        let authClient = null;
        if (window.authClient) {
          console.log('✅ Found authClient on window');
          authClient = window.authClient;
        } else {
          // Method 2: Try React import pattern
          try {
            console.log('🔧 Trying React import...');
            const module = await import('@/lib/auth-client');
            authClient = module.authClient;
            console.log('✅ Successfully imported authClient via React import');
          } catch (importError) {
            console.log('❌ React import failed:', importError.message);

            // Method 3: Try direct module path
            try {
              console.log('🔧 Trying direct module import...');
              const directModule = await import('/src/lib/auth-client.ts');
              authClient = directModule.authClient;
              console.log('✅ Successfully imported via direct path');
            } catch (directError) {
              console.log('❌ Direct import failed:', directError.message);
            }
          }
        }

        if (!authClient) {
          return { error: 'Could not access authClient at all' };
        }

        // Test authClient configuration
        console.log('🔧 Testing authClient configuration...');
        console.log('AuthClient type:', typeof authClient);
        console.log('AuthClient methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(authClient)));

        // Check the baseURL configuration
        const configTest = {
          hasGetSession: typeof authClient.getSession === 'function',
          methods: Object.getOwnPropertyNames(Object.getPrototypeOf(authClient)),
        };

        console.log('Config test:', configTest);

        // Test getSession specifically
        console.log('🔧 About to call authClient.getSession()...');

        const sessionStart = Date.now();
        const session = await authClient.getSession();
        const sessionDuration = Date.now() - sessionStart;

        console.log('🔧 getSession completed in', sessionDuration, 'ms');
        console.log('🔧 Session result type:', typeof session);
        console.log('🔧 Session keys:', session ? Object.keys(session) : 'null');

        if (session) {
          console.log('🔧 Session.user type:', typeof session.user);
          console.log('🔧 Session.user keys:', session.user ? Object.keys(session.user) : 'null');
          console.log('🔧 Session structure:', JSON.stringify(session, null, 2));
        }

        return {
          success: true,
          configTest,
          session: session,
          hasUser: !!(session?.user),
          userEmail: session?.user?.email,
          sessionDuration
        };

      } catch (error) {
        console.error('❌ AuthClient diagnosis error:', error);
        return {
          error: error.message,
          stack: error.stack
        };
      }
    });

    console.log('\n📊 AuthClient Diagnosis Results:');
    console.log('='.repeat(50));

    if (authClientDiagnosis.error) {
      console.log('❌ Error:', authClientDiagnosis.error);
    } else {
      console.log('✅ AuthClient accessible:', authClientDiagnosis.success);
      console.log('Has getSession method:', authClientDiagnosis.configTest?.hasGetSession);
      console.log('Available methods:', authClientDiagnosis.configTest?.methods);
      console.log('Session duration:', authClientDiagnosis.sessionDuration, 'ms');
      console.log('Has session:', !!authClientDiagnosis.session);
      console.log('Has user:', authClientDiagnosis.hasUser);
      console.log('User email:', authClientDiagnosis.userEmail);
    }

    console.log('\n3️⃣ Comparing with direct fetch to find the difference...');

    const comparison = await page.evaluate(async () => {
      try {
        // Direct fetch
        console.log('🔧 Making direct fetch call...');
        const directResponse = await fetch('http://localhost:3003/api/auth/get-session', {
          credentials: 'include'
        });
        const directData = await directResponse.json();
        console.log('🔧 Direct fetch result:', directData);

        return {
          direct: {
            hasUser: !!(directData?.user),
            userEmail: directData?.user?.email,
            structure: directData
          }
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('\n🔍 Final Analysis:');
    if (comparison.error) {
      console.log('❌ Comparison failed:', comparison.error);
    } else {
      console.log('Direct fetch has user:', comparison.direct?.hasUser);
      console.log('AuthClient has user:', authClientDiagnosis.hasUser);
      console.log('Direct email:', comparison.direct?.userEmail);
      console.log('AuthClient email:', authClientDiagnosis.userEmail);

      if (comparison.direct?.hasUser && !authClientDiagnosis.hasUser) {
        console.log('\n❌ CONFIRMED BUG: AuthClient is not returning the same data as direct fetch');
        console.log('The issue is in the Better Auth React client configuration or implementation');
      } else if (authClientDiagnosis.hasUser) {
        console.log('\n✅ AuthClient is working correctly');
      }
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugAuthClientSpecific();