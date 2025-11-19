import { chromium } from 'playwright';

async function testLoginFixed() {
  console.log('🎭 Testing login in browser after fix...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();

  try {
    // Navigate to login
    console.log('📍 Going to login page...');
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    // Fill credentials
    console.log('✍️ Filling credentials...');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Take screenshot before login
    await page.screenshot({ path: 'before-login.png' });

    // Click login button
    console.log('🚀 Clicking Sign In button...');
    await page.click('button:has-text("Sign In to Dashboard")');

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    // Check final URL
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);

    // Take screenshot after login attempt
    await page.screenshot({ path: 'after-login.png' });

    if (finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS! Redirected to dashboard!');
      console.log('🎉 Login is working! You are now in the dashboard.');

      // Take a screenshot of the dashboard
      await page.screenshot({ path: 'dashboard.png' });
      console.log('📸 Dashboard screenshot saved as dashboard.png');
    } else {
      console.log('❌ Still on login page');

      // Check for error messages
      const errors = await page.locator('.error, .toast-error, [role="alert"]').allTextContents();
      if (errors.length > 0) {
        console.log('Error messages:', errors);
      }
    }

    // Keep browser open for 5 seconds to see the result
    console.log('👀 Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

testLoginFixed();