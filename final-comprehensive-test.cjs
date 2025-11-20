const { chromium } = require('playwright');

async function finalComprehensiveTest() {
  console.log('🎯 Final comprehensive login test - THE ULTIMATE VERIFICATION...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Track every console message with timestamps
  page.on('console', msg => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🖥️ [${timestamp}] ${msg.text()}`);
  });

  try {
    console.log('\n🚀 STEP 1: Starting fresh - going to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'step1-login-page.png', fullPage: true });

    console.log('\n🔑 STEP 2: Filling and submitting credentials...');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.screenshot({ path: 'step2-credentials-filled.png', fullPage: true });

    console.log('\n📤 STEP 3: Submitting login form...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000); // Give plenty of time

    let currentUrl = page.url();
    console.log(`\n📍 After login submit: ${currentUrl}`);
    await page.screenshot({ path: 'step3-after-submit.png', fullPage: true });

    console.log('\n🎯 STEP 4: Manually navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for AuthGuard to complete its check
    await page.waitForTimeout(8000);

    currentUrl = page.url();
    console.log(`\n🌐 After manual navigation: ${currentUrl}`);
    await page.screenshot({ path: 'step4-dashboard-attempt.png', fullPage: true });

    console.log('\n🧪 STEP 5: Testing session one more time...');
    const sessionTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3003/api/auth/get-session', {
          credentials: 'include'
        });
        const session = await response.json();
        return {
          isValid: !!session?.user,
          userEmail: session?.user?.email,
          fullSession: session
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('\n📊 FINAL RESULTS:');
    console.log('='.repeat(60));
    console.log(`Final URL: ${currentUrl}`);
    console.log('Session valid:', sessionTest.isValid);
    console.log('User email:', sessionTest.userEmail);

    if (currentUrl.includes('dashboard') && sessionTest.isValid) {
      console.log('\n🎉 SUCCESS! 🎉');
      console.log('✅ Login working correctly');
      console.log('✅ AuthGuard allowing access');
      console.log('✅ User can access dashboard');
      console.log('\n🎊 LOGIN ISSUE COMPLETELY RESOLVED! 🎊');

      // Take a success screenshot
      await page.screenshot({ path: 'SUCCESS-dashboard-access.png', fullPage: true });

    } else if (currentUrl.includes('login')) {
      console.log('\n❌ STILL FAILING');
      console.log('User is being redirected back to login');

      if (sessionTest.isValid) {
        console.log('⚠️ Session is valid but AuthGuard is still blocking');
        console.log('This suggests a logic issue in the AuthGuard component');
      } else {
        console.log('❌ Session is not valid - authentication problem');
      }

    } else {
      console.log(`\n⚠️ UNEXPECTED: Ended up at ${currentUrl}`);
    }

    // Final verification - check cookies
    const cookies = await context.cookies();
    const authCookies = cookies.filter(c =>
      c.name.includes('auth') ||
      c.name.includes('session') ||
      c.name.includes('better-auth')
    );

    console.log(`\n🍪 Authentication cookies: ${authCookies.length} found`);
    for (const cookie of authCookies) {
      console.log(`  - ${cookie.name}: ${cookie.value.slice(0, 20)}... (expires: ${new Date(cookie.expires * 1000).toLocaleString()})`);
    }

  } catch (error) {
    console.error('\n💥 TEST FAILED:', error);
    await page.screenshot({ path: 'ERROR-test-failed.png', fullPage: true });
  } finally {
    // Keep browser open for 5 seconds so we can see the final state
    console.log('\n⏳ Keeping browser open for 5 seconds to verify...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

finalComprehensiveTest();