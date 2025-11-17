#!/usr/bin/env bun

/**
 * Functional Testing Suite for GCMC-KAJ Platform
 *
 * Tests platform functionality via HTTP requests and API calls
 * Since Playwright GUI is not available, this tests:
 * 1. API endpoints and responses
 * 2. Authentication flows
 * 3. tRPC queries
 * 4. Database operations
 * 5. Route accessibility
 */

const BASE_URL = "http://localhost:3000";
const WEB_URL = "http://localhost:3001";

const ADMIN_CONFIG = {
	email: "admin@gcmc-kaj.com",
	password: "GCMCAdmin2024!",
	name: "GCMC-KAJ System Administrator",
};

class FunctionalTestSuite {
	constructor() {
		this.testResults = [];
		this.sessionCookie = null;
		this.errors = [];
	}

	async makeRequest(url, options = {}) {
		try {
			const response = await fetch(url, {
				headers: {
					"Content-Type": "application/json",
					...(this.sessionCookie ? { Cookie: this.sessionCookie } : {}),
					...options.headers,
				},
				...options,
			});

			const contentType = response.headers.get("content-type");
			let data = null;

			if (contentType?.includes("application/json")) {
				const text = await response.text();
				data = text ? JSON.parse(text) : null;
			} else {
				data = await response.text();
			}

			return {
				ok: response.ok,
				status: response.status,
				statusText: response.statusText,
				data,
				headers: response.headers,
			};
		} catch (error) {
			this.errors.push({
				type: "Request Error",
				url,
				message: error.message,
				timestamp: new Date().toISOString(),
			});
			return {
				ok: false,
				error: error.message,
				status: 0,
			};
		}
	}

	async testResult(testName, passed, details = "", error = null) {
		const result = {
			test: testName,
			passed,
			details,
			error: error?.message || null,
			timestamp: new Date().toISOString(),
		};
		this.testResults.push(result);

		const status = passed ? "✅ PASS" : "❌ FAIL";
		console.log(`${status} ${testName}: ${details}`);
		if (error) console.log(`   Error: ${error.message}`);
	}

	// Test 1: Server Health and Availability
	async testServerHealth() {
		console.log("\n🧪 Test 1: Server Health & Availability");

		// Test API server
		const apiHealth = await this.makeRequest(`${BASE_URL}/health`);
		await this.testResult(
			"API Server Health",
			apiHealth.status === 200,
			`API server responded with status ${apiHealth.status}`,
		);

		// Test web server
		const webHealth = await this.makeRequest(WEB_URL);
		await this.testResult(
			"Web Server Health",
			webHealth.status === 200,
			`Web server responded with status ${webHealth.status}`,
		);

		// Test auth endpoints
		const authSession = await this.makeRequest(
			`${BASE_URL}/api/auth/get-session`,
		);
		await this.testResult(
			"Auth Endpoint Available",
			authSession.status === 200,
			`Auth endpoint responded with status ${authSession.status}`,
		);
	}

	// Test 2: Authentication System
	async testAuthentication() {
		console.log("\n🧪 Test 2: Authentication System");

		try {
			// Test admin login
			const loginResponse = await this.makeRequest(
				`${BASE_URL}/api/auth/sign-in/email`,
				{
					method: "POST",
					body: JSON.stringify({
						email: ADMIN_CONFIG.email,
						password: ADMIN_CONFIG.password,
					}),
				},
			);

			const loginSuccess = loginResponse.ok;
			await this.testResult(
				"Admin Login",
				loginSuccess,
				`Login status: ${loginResponse.status}`,
			);

			if (loginSuccess) {
				// Extract session cookie
				const setCookie = loginResponse.headers.get("set-cookie");
				this.sessionCookie = setCookie ? setCookie.split(";")[0] : null;

				// Test session validation
				const sessionResponse = await this.makeRequest(
					`${BASE_URL}/api/auth/get-session`,
				);
				const hasSession = sessionResponse.ok && sessionResponse.data?.user;
				await this.testResult(
					"Session Validation",
					hasSession,
					hasSession
						? `User: ${sessionResponse.data.user.email}`
						: "No session data",
				);

				if (hasSession) {
					const user = sessionResponse.data.user;
					await this.testResult(
						"Admin User Data",
						user.email === ADMIN_CONFIG.email,
						`Email: ${user.email}, ID: ${user.id}`,
					);
				}
			}
		} catch (error) {
			await this.testResult(
				"Authentication Flow",
				false,
				"Authentication test failed",
				error,
			);
		}
	}

	// Test 3: tRPC Endpoints
	async testTRPCEndpoints() {
		console.log("\n🧪 Test 3: tRPC API Endpoints");

		const endpoints = [
			{
				name: "Dashboard Overview",
				url: "/trpc/dashboard.overview?input=%7B%7D",
			},
			{
				name: "Users List",
				url: "/trpc/users.list?input=%7B%22search%22%3A%22%22%2C%22page%22%3A1%2C%22pageSize%22%3A20%7D",
			},
			{
				name: "Roles List",
				url: "/trpc/roles.list?input=%7B%7D",
			},
			{
				name: "Notifications Count",
				url: "/trpc/notifications.count?input=%7B%22channelStatus%22%3A%22pending%22%7D",
			},
			{
				name: "Notifications Recent",
				url: "/trpc/notifications.recent?input=%7B%22limit%22%3A5%7D",
			},
			{
				name: "Clients List",
				url: "/trpc/clients.list?input=%7B%22search%22%3A%22%22%2C%22page%22%3A1%2C%22pageSize%22%3A20%7D",
			},
		];

		for (const endpoint of endpoints) {
			try {
				const response = await this.makeRequest(`${BASE_URL}${endpoint.url}`);
				const success = response.status === 200;
				await this.testResult(
					`tRPC: ${endpoint.name}`,
					success,
					success ? "Endpoint accessible" : `Status: ${response.status}`,
				);

				// Check for tRPC response structure
				if (success && response.data) {
					const hasResult = response.data.result !== undefined;
					await this.testResult(
						`tRPC Response: ${endpoint.name}`,
						hasResult,
						hasResult
							? "Valid tRPC response structure"
							: "Missing result field",
					);
				}
			} catch (error) {
				await this.testResult(
					`tRPC: ${endpoint.name}`,
					false,
					"Endpoint failed",
					error,
				);
			}
		}
	}

	// Test 4: Web Route Accessibility
	async testWebRoutes() {
		console.log("\n🧪 Test 4: Web Route Accessibility");

		const routes = [
			{ path: "/", name: "Home Page" },
			{ path: "/login", name: "Login Page" },
			{ path: "/dashboard", name: "Dashboard Page" },
			{ path: "/admin", name: "Admin Page" },
			{ path: "/clients", name: "Clients Page" },
			{ path: "/documents", name: "Documents Page" },
			{ path: "/filings", name: "Filings Page" },
			{ path: "/analytics", name: "Analytics Page" },
			{ path: "/tasks", name: "Tasks Page" },
			{ path: "/service-requests", name: "Service Requests Page" },
			{ path: "/notifications", name: "Notifications Page" },
		];

		for (const route of routes) {
			try {
				const response = await this.makeRequest(`${WEB_URL}${route.path}`);
				const accessible = response.status === 200 || response.status === 302;
				await this.testResult(
					`Route: ${route.name}`,
					accessible,
					`Status: ${response.status} ${response.statusText}`,
				);

				// Check for basic HTML structure
				if (accessible && typeof response.data === "string") {
					const hasHtml =
						response.data.includes("<html") ||
						response.data.includes("<!DOCTYPE");
					await this.testResult(
						`HTML: ${route.name}`,
						hasHtml,
						hasHtml ? "Valid HTML response" : "Non-HTML response",
					);
				}
			} catch (error) {
				await this.testResult(
					`Route: ${route.name}`,
					false,
					"Route failed",
					error,
				);
			}
		}
	}

	// Test 5: Database Operations
	async testDatabaseOperations() {
		console.log("\n🧪 Test 5: Database Operations");

		try {
			// Test user creation via signup
			const testUserEmail = `test-${Date.now()}@example.com`;
			const signupResponse = await this.makeRequest(
				`${BASE_URL}/api/auth/sign-up/email`,
				{
					method: "POST",
					body: JSON.stringify({
						email: testUserEmail,
						password: "TestPass123!",
						name: "Test User",
					}),
				},
			);

			const signupSuccess = signupResponse.status === 200;
			await this.testResult(
				"User Registration",
				signupSuccess,
				signupSuccess
					? `User created: ${testUserEmail}`
					: `Signup failed: ${signupResponse.status}`,
			);

			// Test data retrieval (users list should now include the new user)
			if (this.sessionCookie) {
				const usersResponse = await this.makeRequest(
					`${BASE_URL}/trpc/users.list?input=%7B%22search%22%3A%22%22%2C%22page%22%3A1%2C%22pageSize%22%3A20%7D`,
				);

				const usersSuccess = usersResponse.status === 200;
				await this.testResult(
					"Database Query",
					usersSuccess,
					usersSuccess
						? "Users query successful"
						: `Query failed: ${usersResponse.status}`,
				);

				if (usersSuccess && usersResponse.data?.result?.data?.users) {
					const userCount = usersResponse.data.result.data.users.length;
					await this.testResult(
						"User Data Retrieved",
						userCount > 0,
						`Found ${userCount} users in database`,
					);
				}
			}
		} catch (error) {
			await this.testResult(
				"Database Operations",
				false,
				"Database test failed",
				error,
			);
		}
	}

	// Test 6: Admin Functionality
	async testAdminFunctionality() {
		console.log("\n🧪 Test 6: Admin Functionality");

		if (!this.sessionCookie) {
			await this.testResult("Admin Tests", false, "No admin session available");
			return;
		}

		try {
			// Test admin access to users
			const adminUsersResponse = await this.makeRequest(
				`${BASE_URL}/trpc/users.list?input=%7B%22search%22%3A%22%22%2C%22page%22%3A1%2C%22pageSize%22%3A20%7D`,
			);

			const adminAccess = adminUsersResponse.status === 200;
			await this.testResult(
				"Admin User Access",
				adminAccess,
				adminAccess
					? "Admin can access user list"
					: `Access denied: ${adminUsersResponse.status}`,
			);

			// Test admin access to roles
			const rolesResponse = await this.makeRequest(
				`${BASE_URL}/trpc/roles.list?input=%7B%7D`,
			);

			const rolesAccess = rolesResponse.status === 200;
			await this.testResult(
				"Admin Roles Access",
				rolesAccess,
				rolesAccess
					? "Admin can access roles"
					: `Access denied: ${rolesResponse.status}`,
			);

			if (rolesAccess && rolesResponse.data?.result?.data) {
				const roleCount = rolesResponse.data.result.data.length;
				await this.testResult(
					"RBAC System",
					roleCount >= 5,
					`Found ${roleCount} roles in RBAC system`,
				);
			}
		} catch (error) {
			await this.testResult(
				"Admin Functionality",
				false,
				"Admin test failed",
				error,
			);
		}
	}

	// Test 7: Error Handling
	async testErrorHandling() {
		console.log("\n🧪 Test 7: Error Handling");

		try {
			// Test invalid endpoint
			const invalidResponse = await this.makeRequest(
				`${BASE_URL}/api/invalid-endpoint`,
			);
			const properError = invalidResponse.status === 404;
			await this.testResult(
				"404 Error Handling",
				properError,
				`Invalid endpoint returns ${invalidResponse.status}`,
			);

			// Test unauthorized access
			const originalCookie = this.sessionCookie;
			this.sessionCookie = null; // Remove auth

			const unauthorizedResponse = await this.makeRequest(
				`${BASE_URL}/trpc/users.list?input=%7B%22search%22%3A%22%22%2C%22page%22%3A1%2C%22pageSize%22%3A20%7D`,
			);

			const properUnauth = unauthorizedResponse.status === 401;
			await this.testResult(
				"Unauthorized Access",
				properUnauth,
				`Unauthorized access returns ${unauthorizedResponse.status}`,
			);

			// Restore session
			this.sessionCookie = originalCookie;

			// Test malformed request
			const malformedResponse = await this.makeRequest(
				`${BASE_URL}/api/auth/sign-in/email`,
				{
					method: "POST",
					body: "invalid json",
				},
			);

			const properMalformed = malformedResponse.status >= 400;
			await this.testResult(
				"Malformed Request",
				properMalformed,
				`Malformed request returns ${malformedResponse.status}`,
			);
		} catch (error) {
			await this.testResult(
				"Error Handling",
				false,
				"Error handling test failed",
				error,
			);
		}
	}

	// Generate test report
	async generateReport() {
		console.log("\n📋 Generating Functional Test Report...");

		const passed = this.testResults.filter((t) => t.passed).length;
		const failed = this.testResults.filter((t) => !t.passed).length;
		const total = this.testResults.length;

		const report = {
			summary: {
				totalTests: total,
				passed: passed,
				failed: failed,
				successRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
				errors: this.errors.length,
				timestamp: new Date().toISOString(),
			},
			testResults: this.testResults,
			errors: this.errors,
			platformStatus: failed === 0 ? "FULLY_FUNCTIONAL" : "NEEDS_ATTENTION",
		};

		// Save report
		await Bun.write(
			"./functional-test-report.json",
			JSON.stringify(report, null, 2),
		);

		// Print summary
		console.log("\n🎯 Functional Test Summary:");
		console.log(`   Total Tests: ${total}`);
		console.log(`   Passed: ${passed} ✅`);
		console.log(`   Failed: ${failed} ❌`);
		console.log(`   Success Rate: ${report.summary.successRate}%`);
		console.log(`   Errors: ${this.errors.length} ⚠️`);
		console.log(`   Platform Status: ${report.platformStatus}`);

		if (failed > 0) {
			console.log("\n❌ Failed Tests:");
			this.testResults
				.filter((t) => !t.passed)
				.forEach((test) => {
					console.log(`   • ${test.test}: ${test.details}`);
				});
		}

		if (this.errors.length > 0) {
			console.log("\n⚠️ Errors Found:");
			this.errors.slice(0, 3).forEach((err) => {
				console.log(`   • ${err.type}: ${err.message}`);
			});
		}

		return report;
	}

	// Run all tests
	async runAllTests() {
		console.log("🚀 GCMC-KAJ Platform - Functional Testing Suite");
		console.log("=".repeat(60));

		await this.testServerHealth();
		await this.testAuthentication();
		await this.testTRPCEndpoints();
		await this.testWebRoutes();
		await this.testDatabaseOperations();
		await this.testAdminFunctionality();
		await this.testErrorHandling();

		const report = await this.generateReport();

		console.log("\n" + "=".repeat(60));
		if (report.summary.failed === 0) {
			console.log("🎉 ALL FUNCTIONAL TESTS PASSED!");
			console.log("✅ Platform is fully functional and ready for use");
		} else {
			console.log("⚠️ SOME TESTS FAILED - Platform needs attention");
			console.log(`📊 Success Rate: ${report.summary.successRate}%`);
		}
		console.log("=".repeat(60));

		return report;
	}
}

// Run functional tests
async function main() {
	const testSuite = new FunctionalTestSuite();

	try {
		const report = await testSuite.runAllTests();
		const success = report.summary.failed === 0;
		process.exit(success ? 0 : 1);
	} catch (error) {
		console.error("💥 Functional testing failed:", error);
		process.exit(1);
	}
}

main().catch(console.error);
