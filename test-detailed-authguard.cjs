const { chromium } = require('playwright');

async function testDetailedAuthGuard() {
  console.log('🔍 Testing AuthGuard with detailed logging...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Capture all console logs with specific filtering
  page.on('console', msg => {
    const text = msg.text();
    console.log(`🖥️ ${text}`);
  });

  try {
    console.log('\n1️⃣ Login...');
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('\n2️⃣ Navigate to dashboard to trigger AuthGuard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(8000); // Wait longer for all logging

    const finalUrl = page.url();
    console.log(`\n🌐 Final URL: ${finalUrl}`);

    if (finalUrl.includes('login')) {
      console.log('❌ Still on login page - AuthGuard is blocking access');
    } else {
      console.log('✅ Successfully accessed dashboard');
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    await browser.close();
  }
}

testDetailedAuthGuard();