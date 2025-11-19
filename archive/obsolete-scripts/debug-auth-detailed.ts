import { chromium } from 'playwright';

async function debugAuthDetailed() {
  console.log('🔍 Detailed auth debugging...');

  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  // Log all network requests
  page.on('request', request => {
    if (request.url().includes('auth')) {
      console.log('📤 REQUEST:', {
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('auth')) {
      console.log('📥 RESPONSE:', {
        status: response.status(),
        url: response.url(),
        headers: await response.allHeaders()
      });

      try {
        const body = await response.text();
        console.log('Response body:', body);
      } catch (e) {
        console.log('Could not read response body');
      }
    }
  });

  // Enable console logging
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  try {
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    console.log('✍️ Filling form...');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    console.log('🔍 About to submit - checking form data...');

    // Let's inspect the form before submitting
    const formData = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        const formData = new FormData(form);
        const data: Record<string, any> = {};
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
        return data;
      }
      return null;
    });

    console.log('Form data:', formData);

    console.log('🚀 Submitting form...');
    await page.click('button[type="submit"]');

    // Wait longer to see the request/response
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔍 Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

debugAuthDetailed();