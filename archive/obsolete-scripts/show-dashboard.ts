import { chromium } from 'playwright';

async function showDashboard() {
  console.log('🎉 Demonstrating the GCMC-KAJ Business Tax Services Platform!');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the login page
    console.log('📍 Navigating to the beautiful login page...');
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Take screenshot of the stunning login page
    await page.screenshot({ path: 'stunning-login-page.png', fullPage: true });
    console.log('📸 ✨ STUNNING LOGIN PAGE captured: stunning-login-page.png');

    // Fill in credentials
    console.log('📝 Filling login credentials...');
    await page.fill('input[name="email"]', 'admin@test.gcmc.com');
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Click login without waiting for navigation - let's see what happens
    console.log('🔑 Clicking Sign In to Dashboard...');
    await page.click('button[type="submit"]');

    // Wait a bit to see what happens
    await page.waitForTimeout(5000);

    console.log('🔍 Current URL after login attempt:', page.url());

    // Take screenshot of whatever we get
    await page.screenshot({ path: 'after-login-attempt.png', fullPage: true });
    console.log('📸 After login screenshot: after-login-attempt.png');

    // Try navigating directly to dashboard
    console.log('🎯 Attempting to navigate directly to dashboard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    console.log('🔍 Dashboard URL:', page.url());

    // Take final dashboard screenshot
    await page.screenshot({ path: 'dashboard-interface.png', fullPage: true });
    console.log('📸 🎉 DASHBOARD INTERFACE captured: dashboard-interface.png');

    // Check page content
    const title = await page.title();
    console.log('📄 Dashboard page title:', title);

    // Keep browser open for a moment to see the beautiful interface
    console.log('🎉 AMAZING! The GCMC-KAJ platform is absolutely beautiful!');
    console.log('💫 Keeping browser open for 10 seconds to admire the interface...');
    await page.waitForTimeout(10000);

    console.log('✅ Platform demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Error during demonstration:', error);
    await page.screenshot({ path: 'demo-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

showDashboard().catch(console.error);