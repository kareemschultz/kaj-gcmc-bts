import { chromium } from 'playwright';

async function comprehensiveLoginTest() {
  console.log('🔍 COMPREHENSIVE LOGIN TEST');
  console.log('==========================\n');

  // Step 1: Test backend auth directly
  console.log('📌 STEP 1: Testing backend auth endpoint directly...');
  try {
    const response = await fetch('http://localhost:3003/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.gcmc.com',
        password: 'TestPassword123!'
      })
    });

    console.log('   Backend response status:', response.status);
    const data = await response.json();
    console.log('   ✅ Backend auth works! Token:', data.token);
  } catch (error) {
    console.error('   ❌ Backend auth failed:', error);
    return;
  }

  // Step 2: Test frontend application
  console.log('\n📌 STEP 2: Testing frontend application...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true // Open developer tools
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable detailed console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error('   🔴 Browser console error:', text);
    } else if (text.includes('error') || text.includes('Error')) {
      console.error('   🟡 Browser console warning:', text);
    }
  });

  page.on('pageerror', err => {
    console.error('   🔴 Page error:', err.message);
  });

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api/auth/')) {
      console.log(`   📤 Auth request: ${request.method()} ${request.url()}`);
      if (request.method() === 'POST') {
        const postData = request.postData();
        console.log(`   📤 Request body: ${postData}`);
      }
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/auth/')) {
      console.log(`   📥 Auth response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // Step 3: Navigate to login page
    console.log('\n📌 STEP 3: Navigating to login page...');
    await page.goto('http://localhost:3001/login', {
      waitUntil: 'networkidle',
      timeout: 10000
    });
    console.log('   ✅ Login page loaded');

    // Step 4: Check page structure
    console.log('\n📌 STEP 4: Checking page structure...');
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();

    console.log(`   Email input found: ${emailInput > 0 ? '✅' : '❌'}`);
    console.log(`   Password input found: ${passwordInput > 0 ? '✅' : '❌'}`);
    console.log(`   Submit button found: ${submitButton > 0 ? '✅' : '❌'}`);

    // Step 5: Fill form
    console.log('\n📌 STEP 5: Filling login form...');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    console.log('   ✅ Form filled');

    // Take screenshot before submit
    await page.screenshot({ path: 'login-filled-comprehensive.png' });

    // Step 6: Submit form and wait
    console.log('\n📌 STEP 6: Submitting form...');

    // Try multiple methods to submit
    const button = page.locator('button:has-text("Sign In")').first();
    if (await button.count() > 0) {
      await button.click();
    } else {
      console.log('   Trying generic submit button...');
      await page.click('button[type="submit"]');
    }

    // Wait for either navigation or error
    console.log('   Waiting for response...');

    try {
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      console.log('   ✅ SUCCESS! Redirected to dashboard!');

      // Take dashboard screenshot
      await page.screenshot({ path: 'dashboard-comprehensive.png' });
      console.log('   📸 Dashboard screenshot saved');

    } catch (navError) {
      console.log('   ❌ No navigation to dashboard occurred');

      // Check current URL
      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);

      // Check for errors
      const errors = await page.locator('.error, .toast-error, [role="alert"], .text-red-500').allTextContents();
      if (errors.length > 0) {
        console.log('   Error messages found:', errors);
      }

      // Take screenshot of current state
      await page.screenshot({ path: 'login-failed-comprehensive.png' });
    }

    // Step 7: Check cookies and storage
    console.log('\n📌 STEP 7: Checking authentication state...');
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
    console.log('   Auth cookie found:', authCookie ? '✅' : '❌');
    if (authCookie) {
      console.log('   Cookie name:', authCookie.name);
      console.log('   Cookie value:', authCookie.value.substring(0, 20) + '...');
    }

    // Check localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });

    console.log('   LocalStorage items:', Object.keys(localStorage).length);
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('user')) {
        console.log(`   - ${key}: ${localStorage[key]?.substring(0, 50)}...`);
      }
    });

    // Keep browser open for inspection
    console.log('\n👀 Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    await page.screenshot({ path: 'error-comprehensive.png' });
  } finally {
    await browser.close();
  }

  console.log('\n📊 TEST COMPLETE');
  console.log('================\n');
}

comprehensiveLoginTest();