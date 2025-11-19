import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));

// Force load the environment
loadEnv({ path: resolve(moduleDir, ".env") });

// Debug env loading
console.log("🔍 Environment loading check:");
console.log("  .env path:", resolve(moduleDir, ".env"));
console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
console.log("  BETTER_AUTH_SECRET:", process.env.BETTER_AUTH_SECRET ? "Set" : "Not set");

import { auth } from "@GCMC-KAJ/auth";

async function debugBetterAuth() {
  console.log("🔍 Debugging Better Auth configuration...");

  // Check environment
  console.log("📋 Environment check:");
  console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing");
  console.log("  BETTER_AUTH_SECRET:", process.env.BETTER_AUTH_SECRET ? "✅ Set" : "❌ Missing");
  console.log("  BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL || "Not set");
  console.log("  NODE_ENV:", process.env.NODE_ENV || "Not set");

  // Check auth object
  console.log("\n🔍 Better Auth object:");
  console.log("  auth object exists:", !!auth);
  console.log("  auth.handler exists:", !!auth.handler);
  console.log("  auth.api exists:", !!auth.api);

  if (auth.api) {
    console.log("  auth.api.getSession exists:", !!auth.api.getSession);
    console.log("  auth.api.signInEmail exists:", !!auth.api.signInEmail);
  }

  // Try to examine what routes Better Auth provides
  console.log("\n🛣️  Testing various endpoint patterns...");

  const patterns = [
    // Better Auth standard patterns
    '/sign-in/email',
    '/sign-up/email',
    '/get-session',
    '/session',
    '/sign-out',

    // Alternative patterns
    '/email/sign-in',
    '/email/signin',
    '/signin',
    '/signup',
    '/login',
    '/auth/signin',
    '/auth/login'
  ];

  for (const path of patterns) {
    try {
      const request = new Request(`http://localhost:3003${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpass'
        })
      });

      const response = await auth.handler(request);
      const status = response.status;
      const statusText = response.statusText;

      if (status !== 404) {
        console.log(`  ✅ ${path}: ${status} ${statusText}`);
        try {
          const body = await response.text();
          if (body.length < 200) {
            console.log(`      Response: ${body}`);
          }
        } catch (e) {
          console.log(`      Could not read response body`);
        }
      } else {
        console.log(`  ❌ ${path}: ${status}`);
      }
    } catch (error) {
      console.log(`  💥 ${path}: ${error instanceof Error ? error.message : 'Error'}`);
    }
  }

  // Try to get session without authentication
  try {
    console.log("\n🍪 Testing session endpoint...");
    const sessionRequest = new Request('http://localhost:3003/get-session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const sessionResponse = await auth.handler(sessionRequest);
    console.log(`  Session endpoint: ${sessionResponse.status} ${sessionResponse.statusText}`);

    const sessionBody = await sessionResponse.text();
    console.log(`  Session response: ${sessionBody}`);
  } catch (error) {
    console.log(`  Session test error: ${error instanceof Error ? error.message : 'Error'}`);
  }

  // Try to understand Better Auth's internal route structure
  console.log("\n📋 Better Auth Configuration Analysis:");
  try {
    // @ts-ignore - accessing internal properties for debugging
    if (auth.$Infer) {
      console.log("  Better Auth seems to be properly initialized");
    }

    // Try to get some route information
    const testGet = new Request('http://localhost:3003/', {
      method: 'GET'
    });

    const getRootResponse = await auth.handler(testGet);
    console.log(`  Root GET: ${getRootResponse.status}`);

    if (getRootResponse.status !== 404) {
      const rootBody = await getRootResponse.text();
      console.log(`  Root response: ${rootBody.substring(0, 500)}`);
    }

  } catch (error) {
    console.log(`  Configuration analysis error: ${error instanceof Error ? error.message : 'Error'}`);
  }
}

debugBetterAuth().catch(console.error);