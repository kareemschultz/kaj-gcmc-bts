const { chromium } = require('playwright');

async function compareSessionCalls() {
  console.log('🔍 Comparing session call differences...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // First login
    console.log('1️⃣ Login first...');
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('2️⃣ Comparing session responses...');

    const sessionComparison = await page.evaluate(async () => {
      console.log('🧪 Testing different session call methods...');

      // Method 1: Direct fetch to auth API
      const directResponse = await fetch('http://localhost:3003/api/auth/get-session', {
        credentials: 'include'
      });
      const directResult = await directResponse.json();

      console.log('📡 Direct fetch result:', directResult);

      // Method 2: Using auth client getSession (if available)
      let authClientResult = null;
      try {
        // We need to wait for auth client to be available in the browser context
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to access authClient from window or import it
        if (window.authClient) {
          authClientResult = await window.authClient.getSession();
        } else {
          // Try to import and use it
          const module = await import('/src/lib/auth-client.ts');
          if (module.authClient) {
            authClientResult = await module.authClient.getSession();
          }
        }
      } catch (error) {
        console.log('❌ Could not access authClient:', error.message);

        // As a fallback, let's see what the authClient would call
        authClientResult = await fetch('http://localhost:3003/api/auth/get-session', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // Try different headers that authClient might use
            'User-Agent': navigator.userAgent,
          }
        }).then(r => r.json());
      }

      return {
        direct: directResult,
        authClient: authClientResult,
        comparison: {
          directHasUser: !!directResult?.user,
          authClientHasUser: !!authClientResult?.user,
          directUserEmail: directResult?.user?.email,
          authClientUserEmail: authClientResult?.user?.email,
          structuresMatch: JSON.stringify(directResult) === JSON.stringify(authClientResult)
        }
      };
    });

    console.log('\n📊 Session Call Comparison Results:');
    console.log('='.repeat(50));

    console.log('\n🔗 Direct fetch result:');
    console.log('  Has user:', sessionComparison.comparison.directHasUser);
    console.log('  User email:', sessionComparison.comparison.directUserEmail);
    console.log('  Structure:', JSON.stringify(sessionComparison.direct, null, 2).slice(0, 200) + '...');

    console.log('\n🔧 Auth client result:');
    console.log('  Has user:', sessionComparison.comparison.authClientHasUser);
    console.log('  User email:', sessionComparison.comparison.authClientUserEmail);
    console.log('  Structure:', JSON.stringify(sessionComparison.authClient, null, 2).slice(0, 200) + '...');

    console.log('\n🔄 Comparison:');
    console.log('  Structures match:', sessionComparison.comparison.structuresMatch);

    if (!sessionComparison.comparison.structuresMatch) {
      console.log('\n❌ FOUND THE ISSUE: Session responses are different!');
      console.log('  Direct call includes user, auth client call does not');
    } else {
      console.log('\n✅ Session responses are identical');
    }

  } catch (error) {
    console.error('💥 Comparison error:', error);
  } finally {
    await browser.close();
  }
}

compareSessionCalls();