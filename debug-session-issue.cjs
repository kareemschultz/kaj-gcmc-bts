const { chromium } = require('playwright');

async function debugSessionIssue() {
  console.log('🔍 Debugging server-side session issue...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    // Enable detailed request logging
    page.on('request', request => {
      if (request.url().includes('dashboard') || request.url().includes('auth') || request.url().includes('api')) {
        console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
        if (request.headers()['cookie']) {
          console.log(`🍪 Request cookies: ${request.headers()['cookie'].slice(0, 100)}...`);
        }
      }
    });

    page.on('response', response => {
      if (response.url().includes('dashboard') || response.url().includes('auth')) {
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    console.log('\n1️⃣ Login and get session...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

    // Login
    await page.evaluate(async () => {
      const response = await fetch('http://localhost:3003/api/auth/sign-in/email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'email=admin@test.gcmc.com&password=TestPassword123!'
      });
      const result = await response.json();
      console.log('✅ Login successful');
    });

    // Get current cookies
    const cookies = await context.cookies();
    console.log('\n2️⃣ Current cookies:');
    for (const cookie of cookies) {
      console.log(`  - ${cookie.name}: ${cookie.value.slice(0, 50)}...`);
      console.log(`    Domain: ${cookie.domain}, Path: ${cookie.path}, Secure: ${cookie.secure}, HttpOnly: ${cookie.httpOnly}, SameSite: ${cookie.sameSite}`);
    }

    console.log('\n3️⃣ Testing direct auth API call to verify session...');
    const sessionFromAPI = await page.evaluate(async () => {
      const response = await fetch('http://localhost:3003/api/auth/get-session', {
        credentials: 'include'
      });
      return await response.json();
    });
    console.log('🔑 Session from API:', sessionFromAPI?.user ? 'VALID' : 'INVALID');

    console.log('\n4️⃣ Accessing dashboard page with browser navigation...');

    // This will trigger the Next.js server-side rendering
    const dashboardResponse = await page.goto('http://localhost:3001/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const responseHeaders = dashboardResponse.headers();
    console.log('📋 Dashboard response headers:');
    console.log('  Status:', dashboardResponse.status());
    console.log('  Location:', responseHeaders['location'] || 'None');

    // Check final URL
    const finalUrl = page.url();
    console.log('🌐 Final URL:', finalUrl);

    if (finalUrl.includes('login')) {
      console.log('❌ SERVER-SIDE SESSION CHECK FAILED');

      console.log('\n5️⃣ Let me try a manual server-side session check...');

      // Try to simulate what the server is doing
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      console.log('🧪 Manual session check with same cookies:');
      const manualSessionCheck = await page.evaluate(async (cookieHeader) => {
        try {
          // Simulate what the server-side authClient.getSession() should do
          const response = await fetch('http://localhost:3003/api/auth/get-session', {
            headers: {
              'Cookie': cookieHeader,
              'User-Agent': navigator.userAgent,
              'Accept': 'application/json',
            }
          });

          const result = await response.json();
          return {
            status: response.status,
            ok: response.ok,
            session: result
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      }, cookieHeader);

      console.log('🔍 Manual session check result:', manualSessionCheck);

      if (manualSessionCheck.session?.user) {
        console.log('✅ Session is valid when called manually');
        console.log('❌ Issue is in Next.js server-side auth client configuration');
      } else {
        console.log('❌ Session is not valid even when called manually');
      }

    } else {
      console.log('✅ SERVER-SIDE SESSION CHECK PASSED');
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugSessionIssue();