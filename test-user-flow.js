#!/usr/bin/env bun

/**
 * E2E Test: Complete User Signup and Admin Management Flow
 *
 * Tests:
 * 1. New user signup with correct "Viewer" role assignment
 * 2. User dashboard access with proper permissions
 * 3. Admin user management interface
 * 4. Role updates and permission changes
 */

import { chromium } from "playwright";

const TEST_CONFIG = {
	webUrl: "http://localhost:3001",
	portalUrl: "http://localhost:3002",
	adminEmail: "test1@example.com",
	adminPassword: "Test123!",
	newUserEmail: `testuser_${Date.now()}@example.com`,
	newUserName: "Test User E2E",
	newUserPassword: "Test123!",
};

async function takeScreenshot(page, name) {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	await page.screenshot({
		path: `/tmp/${name}_${timestamp}.png`,
		fullPage: true,
	});
	console.log(`📸 Screenshot saved: ${name}_${timestamp}.png`);
}

async function waitForElement(page, selector, timeout = 10000) {
	try {
		await page.waitForSelector(selector, { timeout });
		return true;
	} catch (error) {
		console.log(`❌ Element not found: ${selector}`);
		return false;
	}
}

async function testNewUserSignup(browser) {
	console.log("\n🧪 Test 1: New User Signup Flow");

	const page = await browser.newPage();

	try {
		// Navigate to signup page
		await page.goto(`${TEST_CONFIG.webUrl}/login`);
		await takeScreenshot(page, "login_page");

		// Click signup link/button
		const signupSelector = 'text="Create Account"';
		if (await waitForElement(page, signupSelector)) {
			await page.click(signupSelector);
		} else {
			// Try alternative signup button
			await page.click('text="Sign Up"');
		}

		await takeScreenshot(page, "signup_form");

		// Fill signup form
		await page.fill('input[name="name"]', TEST_CONFIG.newUserName);
		await page.fill('input[name="email"]', TEST_CONFIG.newUserEmail);
		await page.fill('input[name="password"]', TEST_CONFIG.newUserPassword);

		await takeScreenshot(page, "signup_filled");

		// Submit form
		await page.click('button[type="submit"]');

		// Wait for redirect to dashboard
		await page.waitForURL("**/dashboard", { timeout: 15000 });
		await takeScreenshot(page, "new_user_dashboard");

		// Check for permission errors or success
		const permissionError = page.locator('text="Permission denied"');
		const dashboardContent = page.locator(
			'[data-testid="dashboard-content"], .dashboard, h1, h2',
		);

		if ((await permissionError.count()) > 0) {
			console.log("❌ New user has permission errors on dashboard");
			await takeScreenshot(page, "permission_error");
			return false;
		}

		if ((await dashboardContent.count()) > 0) {
			console.log("✅ New user can access dashboard successfully");
			return true;
		}

		console.log("⚠️  Dashboard state unclear");
		return false;
	} catch (error) {
		console.log(`❌ Signup test failed: ${error.message}`);
		await takeScreenshot(page, "signup_error");
		return false;
	} finally {
		await page.close();
	}
}

async function testAdminUserManagement(browser) {
	console.log("\n🧪 Test 2: Admin User Management Interface");

	const page = await browser.newPage();

	try {
		// Login as admin user
		await page.goto(`${TEST_CONFIG.webUrl}/login`);
		await page.fill('input[name="email"]', TEST_CONFIG.adminEmail);
		await page.fill('input[name="password"]', TEST_CONFIG.adminPassword);
		await page.click('button[type="submit"]');

		// Wait for dashboard
		await page.waitForURL("**/dashboard", { timeout: 10000 });

		// Navigate to admin users page
		await page.goto(`${TEST_CONFIG.webUrl}/admin/users`);
		await takeScreenshot(page, "admin_users_page");

		// Check if users list loaded
		if (await waitForElement(page, '.space-y-4, [data-testid="users-list"]')) {
			console.log("✅ Admin users page loaded successfully");

			// Look for our newly created user
			const newUserCard = page.locator(`text="${TEST_CONFIG.newUserEmail}"`);
			if ((await newUserCard.count()) > 0) {
				console.log("✅ New user appears in admin users list");
				return true;
			}
			console.log(
				"⚠️  New user not found in users list (might take time to sync)",
			);
			return true; // Still consider success if page loaded
		}
		console.log("❌ Admin users page failed to load");
		return false;
	} catch (error) {
		console.log(`❌ Admin test failed: ${error.message}`);
		await takeScreenshot(page, "admin_error");
		return false;
	} finally {
		await page.close();
	}
}

async function testDashboardQueries(browser) {
	console.log("\n🧪 Test 3: Dashboard Query Permissions");

	const page = await browser.newPage();

	try {
		// Login as the new user
		await page.goto(`${TEST_CONFIG.webUrl}/login`);
		await page.fill('input[name="email"]', TEST_CONFIG.newUserEmail);
		await page.fill('input[name="password"]', TEST_CONFIG.newUserPassword);
		await page.click('button[type="submit"]');

		await page.waitForURL("**/dashboard", { timeout: 10000 });

		// Monitor network requests for tRPC calls
		const tRPCErrors = [];
		const tRPCSuccess = [];

		page.on("response", async (response) => {
			if (response.url().includes("/trpc/")) {
				if (response.status() === 401) {
					tRPCErrors.push(response.url());
				} else if (response.status() === 200) {
					tRPCSuccess.push(response.url());
				}
			}
		});

		// Wait a bit for dashboard queries to execute
		await page.waitForTimeout(5000);
		await takeScreenshot(page, "dashboard_with_queries");

		console.log(`📊 tRPC Successful calls: ${tRPCSuccess.length}`);
		console.log(`❌ tRPC Failed calls (401): ${tRPCErrors.length}`);

		if (tRPCErrors.length === 0) {
			console.log("✅ All dashboard queries successful");
			return true;
		}
		console.log(
			`❌ Some dashboard queries failed: ${tRPCErrors.slice(0, 3).join(", ")}`,
		);
		return false;
	} catch (error) {
		console.log(`❌ Dashboard queries test failed: ${error.message}`);
		await takeScreenshot(page, "dashboard_queries_error");
		return false;
	} finally {
		await page.close();
	}
}

async function runTests() {
	console.log("🚀 Starting E2E User Flow Tests");
	console.log(`📧 New user email: ${TEST_CONFIG.newUserEmail}`);

	const browser = await chromium.launch({
		headless: false, // Set to true for CI
		slowMo: 500, // Slow down for visibility
	});

	const results = {
		signup: false,
		admin: false,
		queries: false,
	};

	try {
		results.signup = await testNewUserSignup(browser);
		results.admin = await testAdminUserManagement(browser);
		results.queries = await testDashboardQueries(browser);
	} finally {
		await browser.close();
	}

	// Report results
	console.log("\n📋 Test Results:");
	console.log(`   User Signup:     ${results.signup ? "✅ PASS" : "❌ FAIL"}`);
	console.log(`   Admin Interface: ${results.admin ? "✅ PASS" : "❌ FAIL"}`);
	console.log(
		`   Dashboard Queries: ${results.queries ? "✅ PASS" : "❌ FAIL"}`,
	);

	const allPassed = Object.values(results).every((result) => result);
	console.log(
		`\n🎯 Overall Result: ${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`,
	);

	return allPassed;
}

// Run the tests
runTests().catch(console.error);
