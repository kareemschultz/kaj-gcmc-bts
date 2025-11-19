import { chromium } from 'playwright';

async function testCompleteFlow() {
  console.log('🔍 Testing complete login to dashboard flow...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3001/login');

    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('🔍 Current URL:', page.url());

    // Fill in login credentials
    console.log('📝 Filling login form...');
    await page.fill('input[name="email"]', 'admin@test.gcmc.com');
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Take a screenshot before login
    await page.screenshot({ path: 'before-login.png', fullPage: true });
    console.log('📸 Screenshot saved: before-login.png');

    // Click sign in button and wait for navigation
    console.log('🔑 Clicking sign in...');
    await Promise.all([
      page.waitForNavigation({ timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    console.log('🔍 After login URL:', page.url());

    // Wait for dashboard to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Take a screenshot of the dashboard
    await page.screenshot({ path: 'dashboard-view.png', fullPage: true });
    console.log('📸 Dashboard screenshot saved: dashboard-view.png');

    // Check if we're on the dashboard
    const title = await page.title();
    console.log('📄 Page title:', title);

    // Check for any error messages
    const errorElements = await page.$$('[data-testid*="error"], .error, [class*="error"]');
    if (errorElements.length > 0) {
      console.log('⚠️  Found error elements on page');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log('❌ Error text:', text);
      }
    }

    // Check for success indicators
    const successElements = await page.$$('[data-testid*="dashboard"], .dashboard, [class*="dashboard"]');
    if (successElements.length > 0) {
      console.log('✅ Found dashboard elements on page');
    }

    // Check page content
    const bodyText = await page.$eval('body', el => el.textContent?.substring(0, 500) || '');
    console.log('📃 Page content preview:', bodyText);

    // Wait a bit longer to see if anything loads
    await page.waitForTimeout(3000);

    // Final screenshot
    await page.screenshot({ path: 'final-dashboard.png', fullPage: true });
    console.log('📸 Final screenshot saved: final-dashboard.png');

    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);

    // Take error screenshot
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved: error-screenshot.png');
  } finally {
    await browser.close();
  }
}

testCompleteFlow().catch(console.error);