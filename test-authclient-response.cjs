const { chromium } = require('playwright');

async function testAuthClientResponse() {
  console.log('🔍 Testing what authClient.getSession() is actually doing vs direct fetch...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Intercept network requests to see exactly what authClient is requesting
  const requests = [];
  const responses = [];

  page.on('request', request => {
    if (request.url().includes('auth') || request.url().includes('session')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        body: request.postData()
      });
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('auth') || response.url().includes('session')) {
      try {
        const body = await response.text();
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: body
        });
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
        if (response.url().includes('get-session')) {
          console.log(`📄 Response body: ${body.slice(0, 200)}...`);
        }
      } catch (e) {
        console.log(`❌ Could not read response body: ${e.message}`);
      }
    }
  });

  try {
    console.log('\n1️⃣ Login...');
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@test.gcmc.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('\n2️⃣ Clear request/response log and test AuthGuard...');
    requests.length = 0;
    responses.length = 0;

    // Navigate to trigger AuthGuard
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(5000);

    console.log('\n📊 AuthGuard Network Activity:');
    console.log('='.repeat(50));
    console.log(`Captured ${requests.length} auth requests and ${responses.length} responses`);

    for (let i = 0; i < Math.min(requests.length, responses.length); i++) {
      const req = requests[i];
      const res = responses[i];

      console.log(`\n🔍 Request ${i + 1}:`);
      console.log(`  URL: ${req.url}`);
      console.log(`  Method: ${req.method}`);
      console.log(`  Headers: ${JSON.stringify(req.headers, null, 2)}`);

      console.log(`\n📄 Response ${i + 1}:`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Headers: ${JSON.stringify(res.headers, null, 2)}`);
      console.log(`  Body: ${res.body}`);

      // Try to parse the JSON response
      try {
        const parsed = JSON.parse(res.body);
        console.log(`  Parsed JSON:`, parsed);
        console.log(`  Has user: ${!!(parsed?.user)}`);
        console.log(`  User email: ${parsed?.user?.email || 'N/A'}`);
      } catch (e) {
        console.log(`  Could not parse as JSON: ${e.message}`);
      }
    }

    console.log('\n3️⃣ Direct comparison test...');

    const detailedComparison = await page.evaluate(async () => {
      try {
        console.log('🧪 Running detailed comparison...');

        // Test 1: Direct fetch exactly as we know it works
        console.log('📡 Test 1: Direct fetch...');
        const directResponse = await fetch('http://localhost:3003/api/auth/get-session', {
          credentials: 'include'
        });
        const directText = await directResponse.text();
        const directData = JSON.parse(directText);

        console.log('Direct response text:', directText);
        console.log('Direct parsed:', directData);

        // Test 2: Try to access the actual authClient from the AuthGuard scope
        // Since the AuthGuard is loaded, the module should be available
        console.log('🔧 Test 2: Trying to replicate authClient behavior...');

        // Check if we can access React context or modules
        let reactAuthResult = null;
        try {
          // The AuthGuard component loads the module, so it should be in the module cache
          // Let's try to find it or replicate its behavior

          // AuthClient is probably making a similar fetch but with different configuration
          console.log('Testing with authClient-style configuration...');

          const authClientResponse = await fetch('http://localhost:3003/api/auth/get-session', {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          });

          const authClientText = await authClientResponse.text();
          console.log('AuthClient-style response text:', authClientText);

          const authClientData = JSON.parse(authClientText);
          console.log('AuthClient-style parsed:', authClientData);

          reactAuthResult = authClientData;

        } catch (error) {
          console.log('AuthClient-style test failed:', error.message);
        }

        return {
          direct: {
            text: directText,
            data: directData,
            hasUser: !!(directData?.user),
            userEmail: directData?.user?.email
          },
          authClientStyle: {
            text: authClientText || null,
            data: reactAuthResult,
            hasUser: !!(reactAuthResult?.user),
            userEmail: reactAuthResult?.user?.email
          }
        };

      } catch (error) {
        console.error('Detailed comparison error:', error);
        return { error: error.message };
      }
    });

    console.log('\n🔍 Detailed Comparison Results:');
    console.log('='.repeat(50));

    if (detailedComparison.error) {
      console.log('❌ Error:', detailedComparison.error);
    } else {
      console.log('\n📡 Direct fetch:');
      console.log('  Response text:', detailedComparison.direct?.text?.slice(0, 200) + '...');
      console.log('  Has user:', detailedComparison.direct?.hasUser);
      console.log('  User email:', detailedComparison.direct?.userEmail);

      console.log('\n🔧 AuthClient-style fetch:');
      console.log('  Response text:', detailedComparison.authClientStyle?.text?.slice(0, 200) + '...');
      console.log('  Has user:', detailedComparison.authClientStyle?.hasUser);
      console.log('  User email:', detailedComparison.authClientStyle?.userEmail);

      const textsMatch = detailedComparison.direct?.text === detailedComparison.authClientStyle?.text;
      console.log('\n🔄 Texts match:', textsMatch);

      if (!textsMatch) {
        console.log('❌ DIFFERENT RESPONSE TEXTS - this explains the bug!');
      } else {
        console.log('✅ Same response texts - bug is in parsing logic');
      }
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  } finally {
    await browser.close();
  }
}

testAuthClientResponse();