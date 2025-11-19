import { chromium } from 'playwright';

async function testBrowserLogin() {
  console.log('🎭 Testing login in actual browser...');

  const browser = await chromium.launch({
    headless: false,  // Show browser so you can see what's happening
    slowMo: 500      // Slow down actions so they're visible
  });

  const page = await browser.newPage();

  try {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser console error:', msg.text());
      }
    });

    page.on('pageerror', err => {
      console.error('❌ Page error:', err.message);
    });

    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('📸 Screenshot saved as login-page.png');

    // Check if form elements exist
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"], input[type="submit"]').count();

    console.log('📋 Form elements found:');
    console.log(`   Email input: ${emailInput > 0 ? '✅' : '❌'}`);
    console.log(`   Password input: ${passwordInput > 0 ? '✅' : '❌'}`);
    console.log(`   Submit button: ${submitButton > 0 ? '✅' : '❌'}`);

    if (emailInput === 0 || passwordInput === 0) {
      console.error('❌ Login form elements not found!');

      // Try to find any input elements
      const allInputs = await page.locator('input').all();
      console.log(`Found ${allInputs.length} input elements total`);

      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        console.log(`   Input ${i}: type="${type}", name="${name}", id="${id}"`);
      }
    }

    // Try to fill in the form
    console.log('✍️ Filling in login form...');

    // Try different selectors
    try {
      await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    } catch (e) {
      console.log('Could not fill email by type, trying other selectors...');
      await page.fill('input[name="email"]', 'admin@test.gcmc.com');
    }

    try {
      await page.fill('input[type="password"]', 'TestPassword123!');
    } catch (e) {
      console.log('Could not fill password by type, trying other selectors...');
      await page.fill('input[name="password"]', 'TestPassword123!');
    }

    // Take screenshot after filling form
    await page.screenshot({ path: 'login-filled.png' });
    console.log('📸 Screenshot saved as login-filled.png');

    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('auth')) {
        console.log('🌐 Auth request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('auth')) {
        console.log('🌐 Auth response:', response.status(), response.url());
      }
    });

    // Try to submit the form
    console.log('🚀 Submitting login form...');

    // Try different ways to submit
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
    } else {
      console.log('No submit button found, trying to press Enter...');
      await page.keyboard.press('Enter');
    }

    // Wait a bit to see what happens
    await page.waitForTimeout(3000);

    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL after login attempt:', currentUrl);

    // Take final screenshot
    await page.screenshot({ path: 'login-result.png' });
    console.log('📸 Screenshot saved as login-result.png');

    // Check for any error messages
    const errorMessages = await page.locator('.error, .toast-error, [role="alert"]').allTextContents();
    if (errorMessages.length > 0) {
      console.error('❌ Error messages found:', errorMessages);
    }

    // Keep browser open for 10 seconds so you can see
    console.log('👀 Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('✅ Browser closed');
  }
}

testBrowserLogin();