import { chromium } from 'playwright';

async function debugAuthRequest() {
  console.log('🔍 Debugging auth request...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Intercept and log the auth request
  await page.route('**/api/auth/**', async (route, request) => {
    console.log('\n📤 Intercepted Request:');
    console.log('   URL:', request.url());
    console.log('   Method:', request.method());
    console.log('   Headers:', request.headers());

    const postData = request.postData();
    console.log('   Body:', postData);

    if (postData) {
      try {
        const parsed = JSON.parse(postData);
        console.log('   Parsed Body:', parsed);
      } catch (e) {
        console.log('   Body is not valid JSON');
      }
    }

    // Continue the request
    await route.continue();
  });

  // Also log responses
  page.on('response', async response => {
    if (response.url().includes('/api/auth/')) {
      console.log('\n📥 Response:');
      console.log('   URL:', response.url());
      console.log('   Status:', response.status());
      try {
        const body = await response.text();
        console.log('   Body:', body);
      } catch (e) {
        console.log('   Could not read body');
      }
    }
  });

  try {
    await page.goto('http://localhost:3001/login');

    // Fill the form
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Click submit
    await page.click('button[type="submit"]');

    // Wait a bit for the request to complete
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugAuthRequest();