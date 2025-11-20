const { chromium } = require('playwright');

async function finalLoginTest() {
  console.log('🎯 Final login test with client-side auth guard...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Log important browser messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 BROWSER ERROR: ${msg.text()}`);
    } else if (msg.text().includes('AuthGuard') || msg.text().includes('✅') || msg.text().includes('❌')) {
      console.log(`🖥️ AUTH: ${msg.text()}`);
    }
  });

  try {
    console.log('\n1️⃣ Going to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'final-test-step1-login.png', fullPage: true });

    console.log('\n2️⃣ Filling credentials...');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.screenshot({ path: 'final-test-step2-filled.png', fullPage: true });

    console.log('\n3️⃣ Submitting login form...');

    // Wait for successful auth response
    const authResponsePromise = page.waitForResponse(response =>
      response.url().includes('sign-in') && response.status() === 200
    );

    await page.click('button[type="submit"]');

    try {
      const authResponse = await authResponsePromise;
      console.log('✅ Auth API response: 200 OK');
    } catch (e) {
      console.log('⚠️ No auth response captured');
    }

    console.log('\n4️⃣ Waiting for redirect or client-side routing...');
    await page.waitForTimeout(3000);

    let currentUrl = page.url();
    console.log(`🌐 URL after login submission: ${currentUrl}`);

    if (currentUrl.includes('login')) {
      console.log('📍 Still on login page, checking if form is redirecting...');

      // Wait a bit more for potential client-side navigation
      await page.waitForTimeout(5000);
      currentUrl = page.url();
      console.log(`🌐 URL after extra wait: ${currentUrl}`);
    }

    await page.screenshot({ path: 'final-test-step4-after-login.png', fullPage: true });

    if (currentUrl.includes('dashboard')) {
      console.log('🎉 SUCCESS! Redirected to dashboard!');
    } else if (currentUrl.includes('login')) {
      console.log('❌ Still on login page - trying manual navigation to dashboard...');

      // Try manual navigation
      console.log('\n5️⃣ Manual navigation to dashboard...');
      await page.goto('http://localhost:3001/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);

      const finalUrl = page.url();
      console.log(`🌐 Final URL after manual navigation: ${finalUrl}`);

      await page.screenshot({ path: 'final-test-step5-manual-dashboard.png', fullPage: true });

      if (finalUrl.includes('dashboard')) {
        console.log('🎉 SUCCESS! Manual navigation to dashboard worked!');
      } else if (finalUrl.includes('login')) {
        console.log('❌ FAILED! Still redirected to login from dashboard');
      } else {
        console.log(`⚠️ Unexpected URL: ${finalUrl}`);
      }
    } else {
      console.log(`⚠️ Unexpected redirect: ${currentUrl}`);
    }

    console.log('\n6️⃣ Final session verification...');
    const finalSession = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3003/api/auth/get-session', {
          credentials: 'include'
        });
        const session = await response.json();
        return {
          isValid: !!session?.user,
          userEmail: session?.user?.email
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('🔑 Final session check:', finalSession);

    // Check cookies
    const cookies = await context.cookies();
    const authCookies = cookies.filter(c => c.name.includes('auth') || c.name.includes('session'));
    console.log(`🍪 Session cookies: ${authCookies.length} found`);

    if (finalSession.isValid) {
      console.log('\n🎊 AUTHENTICATION SUCCESS! 🎊');
      console.log(`👤 User: ${finalSession.userEmail}`);
      console.log('✅ Login flow is working correctly!');
    } else {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('Session is not valid after login');
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    await page.screenshot({ path: 'final-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

finalLoginTest();