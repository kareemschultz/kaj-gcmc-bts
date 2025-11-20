const { chromium } = require('playwright');

async function testFixedLogin() {
  console.log('🚀 Testing login after CORS and CSP fixes...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  // Log network requests
  context.on('request', request => {
    if (request.url().includes('auth') || request.url().includes('api')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  context.on('response', response => {
    if (response.url().includes('auth') || response.url().includes('api')) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 CONSOLE ERROR: ${msg.text()}`);
    } else if (msg.type() === 'log' && msg.text().includes('CSP')) {
      console.log(`🔧 ${msg.text()}`);
    }
  });

  try {
    console.log('\n1️⃣ Loading login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-fixed-step1-login.png', fullPage: true });

    console.log('\n2️⃣ Checking for form elements...');
    const emailInput = await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    const passwordInput = await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 5000 });
    const submitButton = await page.waitForSelector('button[type="submit"], button:has-text("Sign"), button:has-text("Login")', { timeout: 5000 });

    console.log('✅ All form elements found!');

    console.log('\n3️⃣ Filling credentials...');
    await emailInput.fill('admin@test.gcmc.com');
    await passwordInput.fill('TestPassword123!');
    await page.screenshot({ path: 'test-fixed-step3-filled.png', fullPage: true });

    console.log('\n4️⃣ Submitting form...');

    // Wait for auth response
    const authResponsePromise = page.waitForResponse(response =>
      response.url().includes('auth') && (response.request().method() === 'POST' || response.url().includes('sign-in'))
    );

    await submitButton.click();

    console.log('\n5️⃣ Waiting for auth response...');
    try {
      const authResponse = await authResponsePromise;
      console.log(`🔑 Auth response: ${authResponse.status()} ${authResponse.url()}`);

      const responseText = await authResponse.text();
      console.log(`📄 Auth response body: ${responseText.slice(0, 300)}`);

      if (authResponse.status() === 200) {
        console.log('✅ Authentication request successful!');
      } else {
        console.log('❌ Authentication request failed!');
      }
    } catch (e) {
      console.log('⚠️ No auth response captured');
    }

    // Wait and check current state
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`🌐 Current URL: ${currentUrl}`);

    await page.screenshot({ path: 'test-fixed-step5-result.png', fullPage: true });

    if (currentUrl.includes('dashboard')) {
      console.log('🎉 SUCCESS! Redirected to dashboard - login worked!');
    } else if (currentUrl.includes('login')) {
      console.log('❌ Still on login page - login failed');

      // Check for error messages
      const errorElements = await page.$$('[class*="error"], [class*="invalid"], .text-red-500');
      for (const errorEl of errorElements) {
        const errorText = await errorEl.textContent();
        if (errorText && errorText.trim()) {
          console.log(`🚨 Error message: ${errorText}`);
        }
      }
    } else {
      console.log(`⚠️ Unexpected page: ${currentUrl}`);
    }

    console.log('\n6️⃣ Testing dashboard access...');
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const dashboardUrl = page.url();
    console.log(`🏠 Dashboard access URL: ${dashboardUrl}`);

    await page.screenshot({ path: 'test-fixed-step6-dashboard.png', fullPage: true });

    if (dashboardUrl.includes('dashboard')) {
      console.log('🎉 AUTHENTICATION SUCCESS! Can access dashboard!');
    } else if (dashboardUrl.includes('login')) {
      console.log('❌ AUTHENTICATION FAILED! Redirected back to login');
    }

    // Check cookies
    const cookies = await context.cookies();
    const authCookies = cookies.filter(c => c.name.toLowerCase().includes('auth') || c.name.toLowerCase().includes('session'));
    console.log(`🍪 Auth cookies found: ${authCookies.length}`);
    for (const cookie of authCookies) {
      console.log(`  - ${cookie.name}: ${cookie.value.slice(0, 20)}...`);
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    await page.screenshot({ path: 'test-fixed-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testFixedLogin();