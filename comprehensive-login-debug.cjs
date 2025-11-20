const { chromium } = require('playwright');
const path = require('path');

async function comprehensiveLoginDebug() {
  console.log('🚀 Starting comprehensive login flow debug...');

  const browser = await chromium.launch({
    headless: false,  // Show browser for debugging
    slowMo: 1000      // Slow down actions
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  // Enable request/response logging
  context.on('request', request => {
    if (request.url().includes('auth') || request.url().includes('login') || request.url().includes('api')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
      if (request.postData()) {
        console.log(`📝 POST DATA: ${request.postData()}`);
      }
    }
  });

  context.on('response', response => {
    if (response.url().includes('auth') || response.url().includes('login') || response.url().includes('api')) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  const page = await context.newPage();

  // Listen to console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 BROWSER ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`💥 PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('\n1️⃣ Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'debug-step1-login-page.png', fullPage: true });

    console.log('\n2️⃣ Checking if login form exists...');
    await page.waitForSelector('form', { timeout: 10000 });

    // Check all form elements
    const emailInput = await page.$('input[type="email"], input[name="email"], #email');
    const passwordInput = await page.$('input[type="password"], input[name="password"], #password');
    const submitButton = await page.$('button[type="submit"], button:text("Sign"), button:text("Login")');

    console.log(`📧 Email input found: ${!!emailInput}`);
    console.log(`🔑 Password input found: ${!!passwordInput}`);
    console.log(`🔘 Submit button found: ${!!submitButton}`);

    if (!emailInput || !passwordInput || !submitButton) {
      console.log('❌ Missing form elements! Taking screenshot...');
      await page.screenshot({ path: 'debug-missing-elements.png', fullPage: true });

      const formHTML = await page.$eval('body', el => el.innerHTML);
      console.log('📄 Page HTML snippet:', formHTML.slice(0, 1000));
      return;
    }

    console.log('\n3️⃣ Filling in credentials...');
    await emailInput.fill('admin@test.gcmc.com');
    await passwordInput.fill('TestPassword123!');

    await page.screenshot({ path: 'debug-step3-form-filled.png', fullPage: true });

    console.log('\n4️⃣ Submitting form...');

    // Wait for network activity
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('auth') && response.request().method() === 'POST'
    );

    await submitButton.click();

    console.log('\n5️⃣ Waiting for response...');
    try {
      const response = await responsePromise;
      console.log(`📡 Auth response: ${response.status()} ${response.url()}`);

      const responseText = await response.text();
      console.log(`📄 Response body: ${responseText.slice(0, 500)}`);
    } catch (e) {
      console.log('⚠️ No auth response intercepted, checking page changes...');
    }

    // Wait a bit and check what happened
    await page.waitForTimeout(3000);

    console.log('\n6️⃣ Checking current page state...');
    const currentUrl = page.url();
    const title = await page.title();

    console.log(`🌐 Current URL: ${currentUrl}`);
    console.log(`📰 Current title: ${title}`);

    await page.screenshot({ path: 'debug-step6-after-submit.png', fullPage: true });

    // Check for any error messages on the page
    const errorElements = await page.$$('[class*="error"], [class*="invalid"], .text-red-500, .text-destructive');
    if (errorElements.length > 0) {
      console.log('🚨 Error elements found on page:');
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log(`  - ${errorText}`);
      }
    }

    // Check if we're still on login page or moved somewhere else
    if (currentUrl.includes('login')) {
      console.log('❌ Still on login page - login likely failed');

      // Check for any form validation errors
      const inputs = await page.$$('input');
      for (const input of inputs) {
        const validationMessage = await input.evaluate(el => el.validationMessage);
        if (validationMessage) {
          console.log(`⚠️ Validation error: ${validationMessage}`);
        }
      }

    } else {
      console.log('✅ Redirected from login page - might be successful');
    }

    console.log('\n7️⃣ Checking session state...');

    // Try to access a protected page
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const dashboardUrl = page.url();
    console.log(`🏠 Dashboard URL: ${dashboardUrl}`);

    await page.screenshot({ path: 'debug-step7-dashboard-attempt.png', fullPage: true });

    if (dashboardUrl.includes('login')) {
      console.log('❌ Redirected back to login - authentication failed');
    } else if (dashboardUrl.includes('dashboard')) {
      console.log('✅ Successfully accessed dashboard - authentication worked!');
    } else {
      console.log(`⚠️ Unexpected page: ${dashboardUrl}`);
    }

    console.log('\n8️⃣ Final network analysis...');

    // Check cookies
    const cookies = await context.cookies();
    console.log(`🍪 Cookies found: ${cookies.length}`);
    for (const cookie of cookies) {
      if (cookie.name.includes('auth') || cookie.name.includes('session')) {
        console.log(`  - ${cookie.name}: ${cookie.value.slice(0, 50)}...`);
      }
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    await page.screenshot({ path: 'debug-error-final.png', fullPage: true });
  } finally {
    console.log('\n🏁 Debug session complete. Check the generated screenshots.');
    await browser.close();
  }
}

comprehensiveLoginDebug();