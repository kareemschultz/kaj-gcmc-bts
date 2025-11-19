import { chromium } from 'playwright';

async function loginAndShowDashboard() {
  console.log('🔐 Logging into GCMC-KAJ Platform...');

  const browser = await chromium.launch({
    headless: false, // Show browser so you can see
    devtools: true,
    slowMo: 1000 // Slow down actions so you can follow
  });

  const page = await browser.newPage();

  try {
    // Navigate to login
    console.log('📋 Step 1: Going to login page...');
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('📸 Login page screenshot saved as login-page.png');

    // Fill in credentials
    console.log('📋 Step 2: Filling login form...');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Take screenshot before submit
    await page.screenshot({ path: 'login-form-filled.png', fullPage: true });
    console.log('📸 Filled form screenshot saved as login-form-filled.png');

    // Submit form
    console.log('📋 Step 3: Submitting login form...');
    await page.click('button[type="submit"]');

    // Wait for navigation or dashboard to load
    console.log('📋 Step 4: Waiting for dashboard...');
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      console.log('✅ Successfully redirected to dashboard!');
    } catch {
      console.log('⏳ No redirect detected, checking current page...');
    }

    await page.waitForTimeout(3000); // Give it time to load

    // Take screenshot of current page
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    console.log('📸 After login screenshot saved as after-login.png');

    // Check what page we're on
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // If we're on dashboard, take detailed screenshots
    if (currentUrl.includes('dashboard')) {
      console.log('🎉 SUCCESS: On Dashboard!');

      // Take full dashboard screenshot
      await page.screenshot({ path: 'dashboard-full.png', fullPage: true });
      console.log('📸 Full dashboard screenshot saved as dashboard-full.png');

      // Get page title
      const title = await page.title();
      console.log(`📋 Page title: ${title}`);

      // Get visible text content
      const content = await page.textContent('body');
      console.log('📝 Dashboard content preview:');
      console.log(content?.substring(0, 500) + '...');

      // Try to find key dashboard elements
      const elements = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        const sidebar = document.querySelector('.sidebar, [class*="sidebar"]');
        const main = document.querySelector('main, .main-content, [class*="main"]');
        const header = document.querySelector('header, .header, [class*="header"]');

        return {
          hasNav: !!nav,
          hasSidebar: !!sidebar,
          hasMain: !!main,
          hasHeader: !!header,
          navText: nav?.textContent?.substring(0, 200),
          headerText: header?.textContent?.substring(0, 200)
        };
      });

      console.log('🧩 Dashboard structure:');
      console.log(`   Navigation: ${elements.hasNav ? '✅' : '❌'}`);
      console.log(`   Sidebar: ${elements.hasSidebar ? '✅' : '❌'}`);
      console.log(`   Main content: ${elements.hasMain ? '✅' : '❌'}`);
      console.log(`   Header: ${elements.hasHeader ? '✅' : '❌'}`);

      if (elements.navText) {
        console.log(`   Nav content: ${elements.navText}`);
      }
      if (elements.headerText) {
        console.log(`   Header content: ${elements.headerText}`);
      }

    } else {
      console.log('❌ Not on dashboard. Current page content:');
      const content = await page.textContent('body');
      console.log(content?.substring(0, 500));

      // Check for error messages
      const errorElements = await page.$$eval(
        '[class*="error"], .error, [class*="alert"], .alert',
        elements => elements.map(el => el.textContent)
      ).catch(() => []);

      if (errorElements.length > 0) {
        console.log('🚨 Error messages found:');
        errorElements.forEach(error => console.log(`   - ${error}`));
      }
    }

    console.log('\n🔍 Keeping browser open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error during login process:', error);

    // Take screenshot of error state
    await page.screenshot({ path: 'error-state.png', fullPage: true });
    console.log('📸 Error state screenshot saved as error-state.png');

  } finally {
    await browser.close();
  }
}

loginAndShowDashboard().catch(console.error);