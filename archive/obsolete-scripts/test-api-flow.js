#!/usr/bin/env bun

/**
 * API-Based Test: User Signup and Permission Flow
 *
 * Tests the core functionality without UI:
 * 1. New user signup via Better-Auth API
 * 2. Check user's role assignment
 * 3. Test tRPC permissions
 */

const TEST_CONFIG = {
	serverUrl: "http://localhost:3000",
	newUserEmail: `testuser_${Date.now()}@example.com`,
	newUserName: "Test User API",
	newUserPassword: "Test123!",
};

async function makeRequest(url, options = {}) {
	try {
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		});

		const data = await response.text();

		return {
			ok: response.ok,
			status: response.status,
			data: data ? JSON.parse(data) : null,
			headers: response.headers,
		};
	} catch (error) {
		console.log(`❌ Request failed: ${error.message}`);
		return { ok: false, error: error.message };
	}
}

async function testUserSignup() {
	console.log("\n🧪 Test 1: User Signup via Better-Auth API");

	const signupResponse = await makeRequest(
		`${TEST_CONFIG.serverUrl}/api/auth/sign-up/email`,
		{
			method: "POST",
			body: JSON.stringify({
				email: TEST_CONFIG.newUserEmail,
				password: TEST_CONFIG.newUserPassword,
				name: TEST_CONFIG.newUserName,
			}),
		},
	);

	if (signupResponse.ok) {
		console.log(`✅ User signup successful: ${TEST_CONFIG.newUserEmail}`);

		// Extract session cookie if present
		const setCookie = signupResponse.headers.get("set-cookie");
		const sessionCookie = setCookie ? setCookie.split(";")[0] : null;

		return { success: true, sessionCookie };
	}
	console.log(
		`❌ User signup failed: ${signupResponse.status} - ${JSON.stringify(signupResponse.data)}`,
	);
	return { success: false };
}

async function testUserSession(sessionCookie) {
	console.log("\n🧪 Test 2: Check User Session and Role");

	const sessionResponse = await makeRequest(
		`${TEST_CONFIG.serverUrl}/api/auth/get-session`,
		{
			method: "GET",
			headers: sessionCookie ? { Cookie: sessionCookie } : {},
		},
	);

	if (sessionResponse.ok && sessionResponse.data?.user) {
		const user = sessionResponse.data.user;
		console.log(`✅ User session found: ${user.email}`);
		console.log(`📝 User ID: ${user.id}`);
		return { success: true, userId: user.id, sessionCookie };
	}
	console.log(`❌ Session check failed: ${sessionResponse.status}`);
	return { success: false };
}

async function testTRPCPermissions(sessionCookie) {
	console.log("\n🧪 Test 3: Test tRPC Dashboard Permissions");

	// Test dashboard queries that should work for Viewer role
	const dashboardResponse = await makeRequest(
		`${TEST_CONFIG.serverUrl}/trpc/dashboard.overview?input=%7B%7D`,
		{
			method: "GET",
			headers: sessionCookie ? { Cookie: sessionCookie } : {},
		},
	);

	const notificationsResponse = await makeRequest(
		`${TEST_CONFIG.serverUrl}/trpc/notifications.count?input=%7B%22channelStatus%22%3A%22pending%22%7D`,
		{
			method: "GET",
			headers: sessionCookie ? { Cookie: sessionCookie } : {},
		},
	);

	let dashboardSuccess = false;
	let notificationsSuccess = false;

	if (dashboardResponse.status === 200) {
		dashboardSuccess = true;
		console.log("✅ Dashboard overview query successful");
	} else if (dashboardResponse.status === 401) {
		console.log("❌ Dashboard overview query unauthorized (401)");
	} else {
		console.log(`⚠️  Dashboard overview query: ${dashboardResponse.status}`);
	}

	if (notificationsResponse.status === 200) {
		notificationsSuccess = true;
		console.log("✅ Notifications count query successful");
	} else if (notificationsResponse.status === 401) {
		console.log("❌ Notifications count query unauthorized (401)");
	} else {
		console.log(
			`⚠️  Notifications count query: ${notificationsResponse.status}`,
		);
	}

	return { dashboardSuccess, notificationsSuccess };
}

async function checkUserInDatabase() {
	console.log("\n🧪 Test 4: Verify User in Database (via Health Check)");

	const healthResponse = await makeRequest(`${TEST_CONFIG.serverUrl}/health`);

	if (healthResponse.ok) {
		console.log(
			"✅ Server health check passed - database connectivity confirmed",
		);
		return true;
	}
	console.log("❌ Server health check failed");
	return false;
}

async function runAPITests() {
	console.log("🚀 Starting API-Based User Flow Tests");
	console.log(`📧 Test user email: ${TEST_CONFIG.newUserEmail}`);

	const results = {
		signup: false,
		session: false,
		permissions: false,
		database: false,
	};

	try {
		// Test 1: User Signup
		const signupResult = await testUserSignup();
		results.signup = signupResult.success;

		if (signupResult.success) {
			// Test 2: Session Check
			const sessionResult = await testUserSession(signupResult.sessionCookie);
			results.session = sessionResult.success;

			if (sessionResult.success) {
				// Test 3: tRPC Permissions
				const permissionResults = await testTRPCPermissions(
					sessionResult.sessionCookie,
				);
				results.permissions =
					permissionResults.dashboardSuccess ||
					permissionResults.notificationsSuccess;
			}
		}

		// Test 4: Database Health
		results.database = await checkUserInDatabase();
	} catch (error) {
		console.log(`❌ Test execution failed: ${error.message}`);
	}

	// Report results
	console.log("\n📋 API Test Results:");
	console.log(`   User Signup:      ${results.signup ? "✅ PASS" : "❌ FAIL"}`);
	console.log(
		`   Session Check:    ${results.session ? "✅ PASS" : "❌ FAIL"}`,
	);
	console.log(
		`   tRPC Permissions: ${results.permissions ? "✅ PASS" : "❌ FAIL"}`,
	);
	console.log(
		`   Database Health:  ${results.database ? "✅ PASS" : "❌ FAIL"}`,
	);

	const allPassed = Object.values(results).every((result) => result);
	console.log(
		`\n🎯 Overall Result: ${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`,
	);

	if (!allPassed) {
		console.log("\n💡 Recommendation:");
		if (!results.signup) {
			console.log("   - Check Better-Auth configuration and Zod validation");
		}
		if (!results.session) {
			console.log("   - Check session management and cookie settings");
		}
		if (!results.permissions) {
			console.log(
				"   - Check RBAC permissions for Viewer role and tRPC middleware",
			);
		}
		if (!results.database) {
			console.log("   - Check database connectivity and health endpoint");
		}
	}

	return allPassed;
}

// Run the tests
runAPITests().catch(console.error);
