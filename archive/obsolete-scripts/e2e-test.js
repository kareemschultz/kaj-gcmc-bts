#!/usr/bin/env bun

/**
 * Comprehensive E2E Testing Suite for GCMC-KAJ Platform
 *
 * Tests the complete application functionality:
 * 1. Login and authentication flows
 * 2. Dashboard and navigation
 * 3. User management and admin features
 * 4. All major platform features
 * 5. Takes screenshots of each page/state
 * 6. Identifies broken functionality
 */

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const TEST_CONFIG = {
	baseUrl: "http://localhost:3001",
	adminUser: {
		email: "admin@gcmc-kaj.com",
		password: "GCMCAdmin2024!",
		name: "GCMC-KAJ System Administrator",
	},
	testUser: {
		email: `test-${Date.now()}@example.com`,
		password: "TestPass123!",
		name: "Test User",
	},
	screenshotsDir: "./e2e-screenshots",
	timeout: 30000,
};

// Ensure screenshots directory exists
if (!existsSync(TEST_CONFIG.screenshotsDir)) {
	mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
}

class E2ETestSuite {
	constructor() {
		this.browser = null;
		this.page = null;
		this.testResults = [];
		this.screenshots = [];
		this.errors = [];
	}

	async init() {
		console.log("🚀 Initializing E2E Test Suite...");
		this.browser = await chromium.launch({
			headless: false,
			slowMo: 1000, // Slow down for better visibility
		});
		this.page = await this.browser.newPage();
		await this.page.setViewportSize({ width: 1920, height: 1080 });

		// Set up error handling
		this.page.on("pageerror", (err) => {
			this.errors.push({
				type: "JavaScript Error",
				message: err.message,
				stack: err.stack,
				timestamp: new Date().toISOString(),
			});
		});

		this.page.on("requestfailed", (req) => {
			this.errors.push({
				type: "Request Failed",
				url: req.url(),
				method: req.method(),
				failure: req.failure()?.errorText,
				timestamp: new Date().toISOString(),
			});
		});
	}

	async screenshot(name, description = "") {
		const filename = `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
		const filepath = path.join(TEST_CONFIG.screenshotsDir, filename);
		await this.page.screenshot({ path: filepath, fullPage: true });
		this.screenshots.push({
			name,
			description,
			filepath,
			timestamp: new Date().toISOString(),
		});
		console.log(`📸 Screenshot: ${name} → ${filename}`);
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

	async waitAndCheck(selector, testName, timeout = 5000) {
		try {
			await this.page.waitForSelector(selector, { timeout });
			await this.testResult(testName, true, `Found element: ${selector}`);
			return true;
		} catch (error) {
			await this.testResult(
				testName,
				false,
				`Element not found: ${selector}`,
				error,
			);
			return false;
		}
	}

	async checkPageLoad(expectedUrl, testName) {
		try {
			await this.page.waitForLoadState("networkidle", { timeout: 10000 });
			const currentUrl = this.page.url();
			const urlMatches = currentUrl.includes(expectedUrl);
			await this.testResult(
				testName,
				urlMatches,
				`Expected: ${expectedUrl}, Got: ${currentUrl}`,
			);
			return urlMatches;
		} catch (error) {
			await this.testResult(testName, false, "Page load timeout", error);
			return false;
		}
	}

	// Test 1: Application Accessibility and Landing Page
	async testLandingPage() {
		console.log("\n🧪 Test 1: Landing Page & Application Access");

		try {
			await this.page.goto(TEST_CONFIG.baseUrl);
			await this.screenshot(
				"01-landing-page",
				"Initial application landing page",
			);

			await this.checkPageLoad("/", "Landing page loads");
			await this.waitAndCheck("body", "Page body renders");

			// Check for any obvious errors on the page
			const title = await this.page.title();
			await this.testResult(
				"Page has title",
				title.length > 0,
				`Title: ${title}`,
			);
		} catch (error) {
			await this.testResult(
				"Landing page access",
				false,
				"Failed to load landing page",
				error,
			);
		}
	}

	// Test 2: Login Flow Testing
	async testLoginFlow() {
		console.log("\n🧪 Test 2: User Authentication & Login Flow");

		try {
			// Navigate to login page
			await this.page.goto(`${TEST_CONFIG.baseUrl}/login`);
			await this.screenshot("02-login-page", "Login page layout");

			await this.checkPageLoad("/login", "Login page loads");
			await this.waitAndCheck("form", "Login form present");
			await this.waitAndCheck("input[type='email']", "Email input field");
			await this.waitAndCheck("input[type='password']", "Password input field");
			await this.waitAndCheck("button[type='submit']", "Submit button");

			// Test admin login
			await this.page.fill("input[type='email']", TEST_CONFIG.adminUser.email);
			await this.page.fill(
				"input[type='password']",
				TEST_CONFIG.adminUser.password,
			);
			await this.screenshot(
				"03-login-filled",
				"Login form filled with admin credentials",
			);

			await this.page.click("button[type='submit']");
			await this.page.waitForTimeout(3000); // Wait for auth to process

			await this.screenshot("04-post-login", "After login submission");

			// Check if redirected to dashboard
			const currentUrl = this.page.url();
			const loginSuccess =
				currentUrl.includes("/dashboard") || currentUrl.includes("/admin");
			await this.testResult(
				"Admin login success",
				loginSuccess,
				`Redirected to: ${currentUrl}`,
			);
		} catch (error) {
			await this.testResult("Login flow", false, "Login process failed", error);
		}
	}

	// Test 3: Dashboard Functionality
	async testDashboard() {
		console.log("\n🧪 Test 3: Dashboard Functionality");

		try {
			await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
			await this.screenshot("05-dashboard", "Main dashboard page");

			await this.checkPageLoad("/dashboard", "Dashboard loads");

			// Check for main dashboard elements
			await this.waitAndCheck("h1, h2", "Dashboard heading");
			await this.waitAndCheck(
				"[data-testid='stats-cards'], .card",
				"Dashboard cards/stats",
			);

			// Check navigation menu
			await this.waitAndCheck("nav", "Navigation menu");
			await this.waitAndCheck(
				"a[href='/clients'], a[href*='client']",
				"Clients navigation link",
			);
			await this.waitAndCheck(
				"a[href='/documents'], a[href*='document']",
				"Documents navigation link",
			);
			await this.waitAndCheck(
				"a[href='/admin'], a[href*='admin']",
				"Admin navigation link",
			);
		} catch (error) {
			await this.testResult(
				"Dashboard access",
				false,
				"Dashboard failed to load",
				error,
			);
		}
	}

	// Test 4: Admin Panel Testing
	async testAdminPanel() {
		console.log("\n🧪 Test 4: Admin Panel & User Management");

		try {
			await this.page.goto(`${TEST_CONFIG.baseUrl}/admin`);
			await this.screenshot("06-admin-panel", "Admin panel main page");

			await this.checkPageLoad("/admin", "Admin panel loads");

			// Check for admin elements
			await this.waitAndCheck("h1, h2", "Admin panel heading");

			// Test user management section
			const usersTabExists = await this.waitAndCheck(
				"[data-tab='users'], a[href*='users'], button:has-text('Users')",
				"Users management tab/link",
			);

			if (usersTabExists) {
				try {
					await this.page.click(
						"[data-tab='users'], a[href*='users'], button:has-text('Users')",
					);
					await this.page.waitForTimeout(2000);
					await this.screenshot(
						"07-admin-users",
						"Admin users management page",
					);
				} catch (_e) {
					console.log("Could not click users tab, might be already active");
				}
			}

			// Check for user list or table
			await this.waitAndCheck(
				"table, .user-list, .users-grid, [data-testid='users-list']",
				"Users list/table",
			);

			// Check for roles section
			await this.waitAndCheck(
				"[data-tab='roles'], button:has-text('Roles'), a[href*='roles']",
				"Roles management section",
			);
		} catch (error) {
			await this.testResult(
				"Admin panel access",
				false,
				"Admin panel failed",
				error,
			);
		}
	}

	// Test 5: Navigation Testing
	async testNavigation() {
		console.log("\n🧪 Test 5: Platform Navigation Testing");

		const navigationTests = [
			{ path: "/clients", name: "Clients Page" },
			{ path: "/documents", name: "Documents Page" },
			{ path: "/filings", name: "Filings Page" },
			{ path: "/analytics", name: "Analytics Page" },
			{ path: "/tasks", name: "Tasks Page" },
			{ path: "/service-requests", name: "Service Requests Page" },
			{ path: "/notifications", name: "Notifications Page" },
		];

		for (const navTest of navigationTests) {
			try {
				console.log(`  Testing: ${navTest.name}`);
				await this.page.goto(`${TEST_CONFIG.baseUrl}${navTest.path}`);
				await this.page.waitForTimeout(2000);

				const screenshotName = `08-nav-${navTest.path.replace("/", "").replace(/\//g, "-") || "root"}`;
				await this.screenshot(screenshotName, `${navTest.name} page`);

				await this.checkPageLoad(navTest.path, `${navTest.name} loads`);

				// Check for basic page structure
				await this.waitAndCheck(
					"main, .main-content, [role='main']",
					`${navTest.name} main content`,
				);
			} catch (error) {
				await this.testResult(
					`${navTest.name} navigation`,
					false,
					"Navigation failed",
					error,
				);
			}
		}
	}

	// Test 6: Forms and Interactions Testing
	async testFormsAndInteractions() {
		console.log("\n🧪 Test 6: Forms & Interactive Elements");

		try {
			// Test client creation form
			await this.page.goto(`${TEST_CONFIG.baseUrl}/clients`);
			await this.page.waitForTimeout(2000);
			await this.screenshot(
				"09-clients-page",
				"Clients page before interaction",
			);

			// Look for Add Client button
			const addClientBtn = await this.waitAndCheck(
				"button:has-text('Add'), button:has-text('New'), button:has-text('Create'), [data-testid='add-client']",
				"Add Client button",
			);

			if (addClientBtn) {
				try {
					await this.page.click(
						"button:has-text('Add'), button:has-text('New'), button:has-text('Create')",
					);
					await this.page.waitForTimeout(2000);
					await this.screenshot("10-add-client-form", "Add client form/dialog");

					await this.waitAndCheck("form", "Client form appears");
					await this.waitAndCheck("input", "Form input fields");
				} catch (e) {
					console.log("Could not interact with add client button:", e.message);
				}
			}

			// Test search functionality
			await this.page.goto(`${TEST_CONFIG.baseUrl}/clients`);
			await this.page.waitForTimeout(2000);

			const searchInput = await this.waitAndCheck(
				"input[placeholder*='Search'], input[type='search'], .search-input",
				"Search functionality",
			);

			if (searchInput) {
				await this.page.fill(
					"input[placeholder*='Search'], input[type='search']",
					"test search",
				);
				await this.screenshot(
					"11-search-interaction",
					"Search input interaction",
				);
			}
		} catch (error) {
			await this.testResult(
				"Forms and interactions",
				false,
				"Interactive elements failed",
				error,
			);
		}
	}

	// Test 7: Error Handling and Edge Cases
	async testErrorHandling() {
		console.log("\n🧪 Test 7: Error Handling & Edge Cases");

		try {
			// Test 404 page
			await this.page.goto(`${TEST_CONFIG.baseUrl}/nonexistent-page`);
			await this.page.waitForTimeout(2000);
			await this.screenshot("12-404-page", "404 error page");

			const is404 =
				this.page.url().includes("404") ||
				(await this.page.locator("text=404").count()) > 0;
			await this.testResult(
				"404 page handling",
				is404,
				"404 page displays for invalid routes",
			);

			// Test unauthorized access (logout first)
			try {
				await this.page.goto(`${TEST_CONFIG.baseUrl}/api/auth/sign-out`, {
					method: "POST",
				});
				await this.page.waitForTimeout(1000);
			} catch (_e) {
				// Try clicking logout button
				await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
				await this.page.waitForTimeout(2000);
				try {
					await this.page.click(
						"button:has-text('Sign Out'), button:has-text('Logout'), [data-testid='logout']",
					);
					await this.page.waitForTimeout(2000);
				} catch (_logoutErr) {
					console.log("Could not find logout button");
				}
			}

			// Test accessing protected route without auth
			await this.page.goto(`${TEST_CONFIG.baseUrl}/admin`);
			await this.page.waitForTimeout(3000);
			await this.screenshot(
				"13-unauthorized-access",
				"Unauthorized access attempt",
			);

			const redirectedToLogin =
				this.page.url().includes("/login") || this.page.url().includes("/auth");
			await this.testResult(
				"Unauthorized access protection",
				redirectedToLogin,
				"Protected routes redirect unauthenticated users",
			);
		} catch (error) {
			await this.testResult(
				"Error handling",
				false,
				"Error handling test failed",
				error,
			);
		}
	}

	// Test 8: Component Functionality
	async testComponentFunctionality() {
		console.log("\n🧪 Test 8: UI Components & Interactions");

		try {
			// Re-login for component testing
			await this.page.goto(`${TEST_CONFIG.baseUrl}/login`);
			await this.page.fill("input[type='email']", TEST_CONFIG.adminUser.email);
			await this.page.fill(
				"input[type='password']",
				TEST_CONFIG.adminUser.password,
			);
			await this.page.click("button[type='submit']");
			await this.page.waitForTimeout(3000);

			// Test dropdown menus
			await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
			await this.page.waitForTimeout(2000);
			await this.screenshot(
				"14-dashboard-components",
				"Dashboard with components",
			);

			// Test user menu dropdown
			const userMenu = await this.waitAndCheck(
				"button:has-text('test'), [data-testid='user-menu'], .user-menu",
				"User menu dropdown trigger",
			);

			if (userMenu) {
				try {
					await this.page.click(
						"button:has-text('test'), [data-testid='user-menu']",
					);
					await this.page.waitForTimeout(1000);
					await this.screenshot("15-user-menu-open", "User menu dropdown open");
				} catch (_e) {
					console.log("Could not click user menu");
				}
			}

			// Test notification component
			const _notificationIcon = await this.waitAndCheck(
				"[data-testid='notifications'], .notification-icon, button:has(svg)",
				"Notification icon/component",
			);

			// Test responsive behavior
			await this.page.setViewportSize({ width: 768, height: 1024 });
			await this.page.waitForTimeout(1000);
			await this.screenshot("16-mobile-view", "Mobile responsive view");

			await this.page.setViewportSize({ width: 1920, height: 1080 });
			await this.page.waitForTimeout(1000);
		} catch (error) {
			await this.testResult(
				"Component functionality",
				false,
				"Component testing failed",
				error,
			);
		}
	}

	// Generate comprehensive test report
	async generateTestReport() {
		console.log("\n📋 Generating Comprehensive Test Report...");

		const report = {
			summary: {
				totalTests: this.testResults.length,
				passed: this.testResults.filter((t) => t.passed).length,
				failed: this.testResults.filter((t) => t.failed).length,
				screenshots: this.screenshots.length,
				errors: this.errors.length,
				timestamp: new Date().toISOString(),
			},
			testResults: this.testResults,
			screenshots: this.screenshots,
			errors: this.errors,
			recommendations: [],
		};

		// Add recommendations based on test results
		const failedTests = this.testResults.filter((t) => !t.passed);
		if (failedTests.length > 0) {
			report.recommendations.push(
				"Fix failing test cases for improved platform reliability",
			);
		}

		if (this.errors.length > 0) {
			report.recommendations.push(
				"Address JavaScript errors and failed requests",
			);
		}

		if (this.screenshots.length < 10) {
			report.recommendations.push(
				"Ensure all major pages are rendering properly",
			);
		}

		// Save report
		const reportPath = path.join(
			TEST_CONFIG.screenshotsDir,
			"test-report.json",
		);
		await Bun.write(reportPath, JSON.stringify(report, null, 2));

		// Print summary
		console.log("\n🎯 E2E Test Summary:");
		console.log(`   Total Tests: ${report.summary.totalTests}`);
		console.log(`   Passed: ${report.summary.passed} ✅`);
		console.log(`   Failed: ${report.summary.failed} ❌`);
		console.log(`   Screenshots: ${report.summary.screenshots} 📸`);
		console.log(`   Errors Found: ${report.summary.errors} ⚠️`);

		if (failedTests.length > 0) {
			console.log("\n❌ Failed Tests:");
			failedTests.forEach((test) => {
				console.log(`   • ${test.test}: ${test.details}`);
				if (test.error) console.log(`     Error: ${test.error}`);
			});
		}

		if (this.errors.length > 0) {
			console.log("\n⚠️ Errors Detected:");
			this.errors.slice(0, 5).forEach((err) => {
				console.log(`   • ${err.type}: ${err.message || err.url}`);
			});
			if (this.errors.length > 5) {
				console.log(`   ... and ${this.errors.length - 5} more errors`);
			}
		}

		console.log(`\n📁 Full report saved: ${reportPath}`);
		console.log(`📸 Screenshots saved in: ${TEST_CONFIG.screenshotsDir}`);

		return report;
	}

	// Run all tests
	async runAllTests() {
		try {
			await this.init();

			await this.testLandingPage();
			await this.testLoginFlow();
			await this.testDashboard();
			await this.testAdminPanel();
			await this.testNavigation();
			await this.testFormsAndInteractions();
			await this.testErrorHandling();
			await this.testComponentFunctionality();

			const report = await this.generateTestReport();

			return report;
		} catch (error) {
			console.error("❌ E2E Test Suite failed:", error);
			this.errors.push({
				type: "Test Suite Error",
				message: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString(),
			});
		} finally {
			if (this.browser) {
				await this.browser.close();
			}
		}
	}

	async cleanup() {
		if (this.browser) {
			await this.browser.close();
		}
	}
}

// Run the comprehensive E2E test suite
async function main() {
	console.log("🚀 GCMC-KAJ Platform - Comprehensive E2E Testing Suite");
	console.log("=".repeat(60));

	const testSuite = new E2ETestSuite();

	try {
		const report = await testSuite.runAllTests();

		const success = report.summary.failed === 0 && report.summary.errors === 0;

		console.log(`\n${"=".repeat(60)}`);
		if (success) {
			console.log("🎉 ALL E2E TESTS PASSED - Platform is fully functional!");
		} else {
			console.log("⚠️ ISSUES DETECTED - Platform needs attention");
		}
		console.log("=".repeat(60));

		process.exit(success ? 0 : 1);
	} catch (error) {
		console.error("💥 E2E Testing failed catastrophically:", error);
		process.exit(1);
	} finally {
		await testSuite.cleanup();
	}
}

main().catch(console.error);
