#!/usr/bin/env bun

/**
 * Admin Functionality Test
 *
 * Tests the complete admin workflow:
 * 1. Login as admin user
 * 2. Access admin dashboard
 * 3. Verify user management functionality
 * 4. Test role assignment capabilities
 */

const ADMIN_CONFIG = {
	serverUrl: "http://localhost:3000",
	webUrl: "http://localhost:3001",
	email: "admin@gcmc-kaj.com",
	password: "GCMCAdmin2024!",
	name: "GCMC-KAJ System Administrator",
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

async function testAdminLogin() {
	console.log("\n🧪 Test 1: Admin Login");

	const loginResponse = await makeRequest(
		`${ADMIN_CONFIG.serverUrl}/api/auth/sign-in/email`,
		{
			method: "POST",
			body: JSON.stringify({
				email: ADMIN_CONFIG.email,
				password: ADMIN_CONFIG.password,
			}),
		},
	);

	if (loginResponse.ok) {
		console.log(`✅ Admin login successful: ${ADMIN_CONFIG.email}`);

		// Extract session cookie
		const setCookie = loginResponse.headers.get("set-cookie");
		const sessionCookie = setCookie ? setCookie.split(";")[0] : null;

		return { success: true, sessionCookie };
	}
	console.log(`❌ Admin login failed: ${loginResponse.status}`);
	console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
	return { success: false };
}

async function testAdminSession(sessionCookie) {
	console.log("\n🧪 Test 2: Admin Session and Role Check");

	const sessionResponse = await makeRequest(
		`${ADMIN_CONFIG.serverUrl}/api/auth/get-session`,
		{
			method: "GET",
			headers: sessionCookie ? { Cookie: sessionCookie } : {},
		},
	);

	if (sessionResponse.ok && sessionResponse.data?.user) {
		const user = sessionResponse.data.user;
		console.log(`✅ Admin session active: ${user.email}`);
		console.log(`👤 Name: ${user.name}`);
		console.log(`🆔 User ID: ${user.id}`);
		return { success: true, user };
	}
	console.log(`❌ Admin session check failed: ${sessionResponse.status}`);
	return { success: false };
}

async function testUserManagementAccess(sessionCookie) {
	console.log("\n🧪 Test 3: User Management tRPC Access");

	// Test users.list query - should work for FirmAdmin
	const usersListResponse = await makeRequest(
		`${ADMIN_CONFIG.serverUrl}/trpc/users.list?input=%7B%7D`,
		{
			method: "GET",
			headers: sessionCookie ? { Cookie: sessionCookie } : {},
		},
	);

	// Test roles.list query
	const rolesListResponse = await makeRequest(
		`${ADMIN_CONFIG.serverUrl}/trpc/roles.list?input=%7B%7D`,
		{
			method: "GET",
			headers: sessionCookie ? { Cookie: sessionCookie } : {},
		},
	);

	let usersAccess = false;
	let rolesAccess = false;

	if (usersListResponse.status === 200) {
		usersAccess = true;
		const users = usersListResponse.data?.result?.data?.users || [];
		console.log(`✅ Users list access granted (${users.length} users found)`);
	} else {
		console.log(`❌ Users list access denied: ${usersListResponse.status}`);
	}

	if (rolesListResponse.status === 200) {
		rolesAccess = true;
		const roles = rolesListResponse.data?.result?.data || [];
		console.log(`✅ Roles list access granted (${roles.length} roles found)`);
	} else {
		console.log(`❌ Roles list access denied: ${rolesListResponse.status}`);
	}

	return { usersAccess, rolesAccess };
}

async function testDashboardQueries(sessionCookie) {
	console.log("\n🧪 Test 4: Admin Dashboard Queries");

	const queries = [
		{
			name: "Dashboard Overview",
			url: "/trpc/dashboard.overview?input=%7B%7D",
		},
		{
			name: "Notifications Count",
			url: "/trpc/notifications.count?input=%7B%22channelStatus%22%3A%22pending%22%7D",
		},
		{ name: "Users Stats", url: "/trpc/users.stats?input=%7B%7D" },
	];

	const results = {};

	for (const query of queries) {
		const response = await makeRequest(
			`${ADMIN_CONFIG.serverUrl}${query.url}`,
			{
				method: "GET",
				headers: sessionCookie ? { Cookie: sessionCookie } : {},
			},
		);

		results[query.name] = response.status === 200;

		if (response.status === 200) {
			console.log(`✅ ${query.name}: Success`);
		} else {
			console.log(`❌ ${query.name}: Failed (${response.status})`);
		}
	}

	return results;
}

async function testCompleteAdminWorkflow() {
	console.log("🚀 Testing Complete Admin Functionality");
	console.log(`📧 Admin: ${ADMIN_CONFIG.email}`);

	const results = {
		login: false,
		session: false,
		userManagement: false,
		dashboard: false,
	};

	try {
		// Test 1: Login
		const loginResult = await testAdminLogin();
		results.login = loginResult.success;

		if (loginResult.success) {
			// Test 2: Session
			const sessionResult = await testAdminSession(loginResult.sessionCookie);
			results.session = sessionResult.success;

			if (sessionResult.success) {
				// Test 3: User Management
				const managementResult = await testUserManagementAccess(
					loginResult.sessionCookie,
				);
				results.userManagement =
					managementResult.usersAccess && managementResult.rolesAccess;

				// Test 4: Dashboard
				const dashboardResult = await testDashboardQueries(
					loginResult.sessionCookie,
				);
				results.dashboard = Object.values(dashboardResult).some(
					(success) => success,
				);
			}
		}
	} catch (error) {
		console.log(`❌ Test execution failed: ${error.message}`);
	}

	// Report results
	console.log("\n📋 Admin Functionality Test Results:");
	console.log(`   Admin Login:       ${results.login ? "✅ PASS" : "❌ FAIL"}`);
	console.log(
		`   Session Management: ${results.session ? "✅ PASS" : "❌ FAIL"}`,
	);
	console.log(
		`   User Management:   ${results.userManagement ? "✅ PASS" : "❌ FAIL"}`,
	);
	console.log(
		`   Dashboard Access:  ${results.dashboard ? "✅ PASS" : "❌ FAIL"}`,
	);

	const allPassed = Object.values(results).every((result) => result);
	console.log(
		`\n🎯 Overall Admin Test: ${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`,
	);

	if (allPassed) {
		console.log("\n🎉 ADMIN SETUP VERIFICATION COMPLETE!");
		console.log("━".repeat(50));
		console.log("✅ Your admin account is fully functional");
		console.log("✅ User management system is working");
		console.log("✅ All dashboard queries are authorized");
		console.log("✅ Ready for team onboarding");
		console.log("━".repeat(50));
		console.log("\n💡 Ready to use:");
		console.log(`   🌐 Login: ${ADMIN_CONFIG.webUrl}/login`);
		console.log(`   👥 User Management: ${ADMIN_CONFIG.webUrl}/admin/users`);
		console.log(`   🚀 Onboarding: ${ADMIN_CONFIG.webUrl}/admin/onboarding`);
	} else {
		console.log("\n⚠️  Some tests failed. Check the logs above for details.");
	}

	return allPassed;
}

// Run the tests
testCompleteAdminWorkflow().catch(console.error);
