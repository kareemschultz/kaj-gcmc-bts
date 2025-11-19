// Quick test to see what endpoints Better Auth actually provides
import { auth } from "@GCMC-KAJ/auth";

async function testAuthEndpoints() {
  console.log("🧪 Testing Better Auth endpoints...");

  // Test different paths to see what Better Auth responds to
  const testPaths = [
    '/sign-in/email',
    '/signin/email',
    '/auth/sign-in/email',
    '/',
    '/session',
    '/user',
    '/me'
  ];

  for (const path of testPaths) {
    try {
      const testRequest = new Request(`http://localhost:3003${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.gcmc.com',
          password: 'TestPassword123!'
        })
      });

      console.log(`\n🌐 Testing path: ${path}`);
      const response = await auth.handler(testRequest);
      console.log(`✅ ${path}: ${response.status} ${response.statusText}`);

      try {
        const body = await response.text();
        if (body && body !== 'null') {
          console.log(`📄 Response: ${body}`);
        }
      } catch (e) {
        console.log(`📄 Could not read response body`);
      }

    } catch (error) {
      console.log(`❌ ${path}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Let's also try GET requests for session/status endpoints
  const getTestPaths = [
    '/',
    '/session',
    '/user',
    '/me',
    '/get-session'
  ];

  console.log('\n\n🔍 Testing GET endpoints...');
  for (const path of getTestPaths) {
    try {
      const testRequest = new Request(`http://localhost:3003${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`\n🌐 Testing GET path: ${path}`);
      const response = await auth.handler(testRequest);
      console.log(`✅ ${path}: ${response.status} ${response.statusText}`);

      try {
        const body = await response.text();
        if (body && body !== 'null') {
          console.log(`📄 Response: ${body}`);
        }
      } catch (e) {
        console.log(`📄 Could not read response body`);
      }

    } catch (error) {
      console.log(`❌ ${path}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

testAuthEndpoints().catch(console.error);