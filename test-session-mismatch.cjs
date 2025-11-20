const { chromium } = require('playwright');

async function testSessionMismatch() {
  console.log('🧪 Testing session consistency between client and server...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('\n1️⃣ Going to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

    console.log('\n2️⃣ Doing direct login via API...');
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
      console.log('📡 Login response:', result);
    });

    console.log('\n3️⃣ Checking client-side session...');
    const clientSession = await page.evaluate(async () => {
      const sessionResponse = await fetch('http://localhost:3003/api/auth/get-session', {
        credentials: 'include'
      });
      return await sessionResponse.json();
    });
    console.log('👤 Client-side session:', clientSession);

    console.log('\n4️⃣ Checking dashboard with server-side headers...');

    // Get all cookies to see what's being sent
    const cookies = await context.cookies();
    console.log('🍪 Available cookies:');
    for (const cookie of cookies) {
      console.log(`  - ${cookie.name}: ${cookie.value.slice(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
    }

    // Try to access dashboard and see what happens
    console.log('\n5️⃣ Attempting dashboard access...');

    // Use page.goto to trigger server-side rendering
    try {
      const dashboardResponse = await page.goto('http://localhost:3001/dashboard', {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      console.log(`🌐 Dashboard response status: ${dashboardResponse.status()}`);
      const finalUrl = page.url();
      console.log(`🌐 Final URL after dashboard access: ${finalUrl}`);

      if (finalUrl.includes('dashboard')) {
        console.log('✅ SUCCESS! Stayed on dashboard - session works server-side');
      } else if (finalUrl.includes('login')) {
        console.log('❌ REDIRECTED TO LOGIN - server-side session check failed');

        // Let's check if the session is being sent properly to the server
        console.log('\n6️⃣ Debugging server session headers...');

        await page.evaluate(() => {
          console.log('🔍 All cookies available to browser:');
          console.log(document.cookie);
        });

      } else {
        console.log(`⚠️ UNEXPECTED REDIRECT: ${finalUrl}`);
      }

    } catch (navError) {
      console.log('💥 Navigation error:', navError.message);
    }

    // Let's also test if we can access dashboard by making a direct request with cookies
    console.log('\n7️⃣ Testing direct server request with cookies...');

    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    console.log('🍪 Cookie header for server request:', cookieHeader);

    try {
      const serverResponse = await fetch('http://localhost:3001/dashboard', {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (compatible; Test-Agent)',
        },
      });

      console.log(`📡 Direct server response status: ${serverResponse.status()}`);

      if (serverResponse.status === 200) {
        console.log('✅ Server accepted the session directly');
      } else if (serverResponse.redirected) {
        console.log('🔄 Server redirected:', serverResponse.url);
      } else {
        console.log('❌ Server rejected the session');
      }

    } catch (fetchError) {
      console.log('💥 Direct fetch error:', fetchError.message);
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    await browser.close();
  }
}

testSessionMismatch();