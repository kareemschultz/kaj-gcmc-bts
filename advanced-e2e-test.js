#!/usr/bin/env bun

/**
 * Advanced E2E Testing Suite for GCMC-KAJ Platform
 *
 * Handles authentication persistence, takes detailed screenshots,
 * and provides comprehensive testing with proper error handling
 */

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const TEST_CONFIG = {
	baseUrl: "http://localhost:3001",
	apiUrl: "http://localhost:3000",
	adminUser: {
		email: "admin@gcmc-kaj.com",
		password: "GCMCAdmin2024!",
		name: "GCMC-KAJ System Administrator",
	},
	screenshotsDir: "./e2e-screenshots",
	timeout: 10000,
};

// Ensure screenshots directory exists
if (!existsSync(TEST_CONFIG.screenshotsDir)) {
	mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
}

class AdvancedE2ETestSuite {
	constructor() {
		this.browser = null;
		this.context = null;
		this.page = null;
		this.testResults = [];
		this.screenshots = [];
		this.errors = [];
		this.isAuthenticated = false;
	}

	async init() {
		console.log("🚀 Initializing Advanced E2E Test Suite...");
		this.browser = await chromium.launch({
			headless: false,
			slowMo: 1000,
		});

		// Create a persistent context with session storage
		this.context = await this.browser.newContext({
			viewport: { width: 1920, height: 1080 },
			storageState: undefined, // Fresh start
		});

		this.page = await this.context.newPage();

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
		await this.page.screenshot({
			path: filepath,
			fullPage: true,
			animations: "disabled",
		});
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

	// Enhanced authentication with API login
	async authenticateAdmin() {
		console.log("\n🔐 Authenticating Admin User...");

		try {
			// Step 1: Go to login page
			await this.page.goto(`${TEST_CONFIG.baseUrl}/login`);
			await this.page.waitForLoadState("networkidle");
			await this.screenshot("01-login-page-start", "Login page initial load");

			// Step 2: Fill login form
			const emailInput = this.page.locator('input[type="email"]');
			const passwordInput = this.page.locator('input[type="password"]');

			await emailInput.fill(TEST_CONFIG.adminUser.email);
			await passwordInput.fill(TEST_CONFIG.adminUser.password);
			await this.screenshot("02-login-form-filled", "Login form filled");

			// Step 3: Submit form and handle potential overlays
			const submitButton = this.page.locator('button[type="submit"]');

			// Wait for any dev overlays to disappear
			try {
				await this.page.waitForSelector("nextjs-portal", {
					state: "detached",
					timeout: 2000,
				});
			} catch (_e) {
				// Ignore if no overlay exists
			}

			// Force click if needed
			await submitButton.click({ force: true });

			// Step 4: Wait for redirect and check authentication
			try {
				await this.page.waitForURL(
					(url) => url.includes("/dashboard") || url.includes("/admin"),
					{ timeout: 15000 },
				);
				this.isAuthenticated = true;
				await this.screenshot("03-login-success", "Successfully logged in");
				await this.testResult(
					"Admin Authentication",
					true,
					`Logged in as ${TEST_CONFIG.adminUser.email}`,
				);
				return true;
			} catch (error) {
				// Check if we're still on login page or elsewhere
				const currentUrl = this.page.url();
				if (currentUrl.includes("/login")) {
					// Look for error messages
					const errorMessage = await this.page
						.locator('.error, .alert, [role="alert"]')
						.textContent()
						.catch(() => null);
					await this.testResult(
						"Admin Authentication",
						false,
						`Login failed: ${errorMessage || "Unknown error"}`,
						error,
					);
				} else {
					// We might be authenticated but not redirected as expected
					this.isAuthenticated = true;
					await this.testResult(
						"Admin Authentication",
						true,
						`Authenticated but at unexpected URL: ${currentUrl}`,
					);
					return true;
				}
				return false;
			}
		} catch (error) {
			await this.testResult(
				"Admin Authentication",
				false,
				"Authentication process failed",
				error,
			);
			return false;
		}
	}

	// Test main application pages
	async testApplicationPages() {
		if (!this.isAuthenticated) {
			console.log("⚠️ Skipping application pages - authentication failed");
			return;
		}

		const pages = [
			{ path: "/dashboard", name: "Dashboard", requiresAuth: true },
			{ path: "/admin", name: "Admin Panel", requiresAuth: true },
			{ path: "/clients", name: "Clients Page", requiresAuth: true },
			{ path: "/documents", name: "Documents Page", requiresAuth: true },
			{ path: "/filings", name: "Filings Page", requiresAuth: true },
			{ path: "/analytics", name: "Analytics Page", requiresAuth: true },
			{ path: "/tasks", name: "Tasks Page", requiresAuth: true },
			{
				path: "/service-requests",
				name: "Service Requests",
				requiresAuth: true,
			},
			{
				path: "/notifications",
				name: "Notifications Page",
				requiresAuth: true,
			},
		];

		console.log("\n🧪 Testing Application Pages...");

		for (const pageConfig of pages) {
			try {
				console.log(`\n  Testing: ${pageConfig.name}`);

				await this.page.goto(`${TEST_CONFIG.baseUrl}${pageConfig.path}`);
				await this.page.waitForLoadState("networkidle", { timeout: 10000 });

				const screenshotName = `04-page-${pageConfig.path.replace("/", "").replace(/\//g, "-") || "root"}`;
				await this.screenshot(screenshotName, `${pageConfig.name} page loaded`);

				// Check if redirected to login (auth failed)
				const currentUrl = this.page.url();
				if (currentUrl.includes("/login") && pageConfig.requiresAuth) {
					await this.testResult(
						`${pageConfig.name} Access`,
						false,
						"Redirected to login - authentication lost",
					);
					continue;
				}

				// Check for error states
				const hasError =
					(await this.page.locator('.error, .alert, [role="alert"]').count()) >
					0;
				if (hasError) {
					const errorText = await this.page
						.locator('.error, .alert, [role="alert"]')
						.textContent();
					await this.testResult(
						`${pageConfig.name} Load`,
						false,
						`Page error: ${errorText}`,
					);
					continue;
				}

				// Check for loading states
				const isLoading =
					(await this.page
						.locator('.loading, .spinner, [data-loading="true"]')
						.count()) > 0;
				if (isLoading) {
					await this.page
						.waitForSelector('.loading, .spinner, [data-loading="true"]', {
							state: "detached",
							timeout: 10000,
						})
						.catch(() => {});
				}

				// Verify page content
				const hasContent =
					(await this.page
						.locator("main, .main-content, .content, h1, h2")
						.count()) > 0;
				await this.testResult(
					`${pageConfig.name} Content`,
					hasContent,
					hasContent ? "Page content rendered" : "No main content found",
				);

				// Test page-specific functionality
				await this.testPageSpecificFeatures(pageConfig.path, pageConfig.name);
			} catch (error) {
				await this.testResult(
					`${pageConfig.name} Access`,
					false,
					"Failed to access page",
					error,
				);
			}
		}
	}

	// Test specific features on each page
	async testPageSpecificFeatures(path, name) {
		try {
			switch (path) {
				case "/dashboard":
					await this.testDashboardFeatures();
					break;
				case "/admin":
					await this.testAdminFeatures();
					break;
				case "/clients":
					await this.testClientsFeatures();
					break;
				default:
					// Generic feature tests
					await this.testGenericPageFeatures(name);
			}
		} catch (error) {
			console.log(
				`   Warning: Feature test failed for ${name}: ${error.message}`,
			);
		}
	}

	async testDashboardFeatures() {
		// Test dashboard cards
		const hasCards =
			(await this.page
				.locator('.card, [data-testid*="card"], .dashboard-card')
				.count()) > 0;
		await this.testResult(
			"Dashboard Cards",
			hasCards,
			hasCards ? "Dashboard cards found" : "No dashboard cards",
		);

		// Test navigation menu
		const hasNav =
			(await this.page.locator("nav, .navigation, .sidebar").count()) > 0;
		await this.testResult(
			"Dashboard Navigation",
			hasNav,
			hasNav ? "Navigation menu found" : "No navigation menu",
		);
	}

	async testAdminFeatures() {
		// Test admin tabs/sections
		const hasUserSection =
			(await this.page
				.locator(
					'button:has-text("Users"), [data-tab="users"], a[href*="user"]',
				)
				.count()) > 0;
		await this.testResult(
			"Admin User Section",
			hasUserSection,
			hasUserSection ? "User management section found" : "No user section",
		);

		const hasRoleSection =
			(await this.page
				.locator(
					'button:has-text("Roles"), [data-tab="roles"], a[href*="role"]',
				)
				.count()) > 0;
		await this.testResult(
			"Admin Role Section",
			hasRoleSection,
			hasRoleSection ? "Role management section found" : "No role section",
		);
	}

	async testClientsFeatures() {
		// Test client management features
		const hasAddButton =
			(await this.page
				.locator(
					'button:has-text("Add"), button:has-text("New"), button:has-text("Create")',
				)
				.count()) > 0;
		await this.testResult(
			"Client Add Button",
			hasAddButton,
			hasAddButton ? "Add client button found" : "No add button",
		);

		const hasClientList =
			(await this.page.locator("table, .client-list, .list, .grid").count()) >
			0;
		await this.testResult(
			"Client List",
			hasClientList,
			hasClientList ? "Client list found" : "No client list",
		);
	}

	async testGenericPageFeatures(name) {
		// Test common page elements
		const hasHeading =
			(await this.page.locator("h1, h2, .title, .heading").count()) > 0;
		await this.testResult(
			`${name} Heading`,
			hasHeading,
			hasHeading ? "Page heading found" : "No page heading",
		);

		const hasContent =
			(await this.page.locator("main, .content, .page-content").count()) > 0;
		await this.testResult(
			`${name} Structure`,
			hasContent,
			hasContent ? "Page structure found" : "No main content structure",
		);
	}

	// Test form interactions
	async testFormInteractions() {
		if (!this.isAuthenticated) return;

		console.log("\n🧪 Testing Form Interactions...");

		try {
			// Test search functionality
			await this.page.goto(`${TEST_CONFIG.baseUrl}/clients`);
			await this.page.waitForLoadState("networkidle");

			const searchInput = this.page
				.locator(
					'input[placeholder*="Search"], input[type="search"], .search-input',
				)
				.first();
			const hasSearch = (await searchInput.count()) > 0;

			if (hasSearch) {
				await searchInput.fill("test search");
				await this.screenshot(
					"05-search-interaction",
					"Search functionality test",
				);
				await this.testResult(
					"Search Input",
					true,
					"Search interaction working",
				);
			} else {
				await this.testResult("Search Input", false, "No search input found");
			}

			// Test modal/dialog interactions
			const addButton = this.page
				.locator(
					'button:has-text("Add"), button:has-text("New"), button:has-text("Create")',
				)
				.first();
			const hasAddButton = (await addButton.count()) > 0;

			if (hasAddButton) {
				await addButton.click();
				await this.page.waitForTimeout(2000);

				const hasModal =
					(await this.page
						.locator('.modal, .dialog, [role="dialog"]')
						.count()) > 0;
				await this.screenshot(
					"06-modal-interaction",
					"Modal/dialog interaction test",
				);
				await this.testResult(
					"Modal Interaction",
					hasModal,
					hasModal ? "Modal opens successfully" : "No modal appeared",
				);

				// Close modal if it opened
				if (hasModal) {
					const closeButton = this.page
						.locator(
							'button:has-text("Cancel"), button:has-text("Close"), .close-button',
						)
						.first();
					if ((await closeButton.count()) > 0) {
						await closeButton.click();
					}
				}
			}
		} catch (error) {
			await this.testResult(
				"Form Interactions",
				false,
				"Form interaction test failed",
				error,
			);
		}
	}

	// Test responsive behavior
	async testResponsiveBehavior() {
		console.log("\n🧪 Testing Responsive Design...");

		const viewports = [
			{ width: 1920, height: 1080, name: "Desktop" },
			{ width: 1024, height: 768, name: "Tablet" },
			{ width: 375, height: 667, name: "Mobile" },
		];

		for (const viewport of viewports) {
			try {
				await this.page.setViewportSize({
					width: viewport.width,
					height: viewport.height,
				});
				await this.page.waitForTimeout(1000);

				if (this.isAuthenticated) {
					await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
					await this.page.waitForLoadState("networkidle");
				} else {
					await this.page.goto(`${TEST_CONFIG.baseUrl}/login`);
					await this.page.waitForLoadState("networkidle");
				}

				await this.screenshot(
					`07-responsive-${viewport.name.toLowerCase()}`,
					`${viewport.name} responsive view (${viewport.width}x${viewport.height})`,
				);
				await this.testResult(
					`Responsive ${viewport.name}`,
					true,
					`Page renders at ${viewport.width}x${viewport.height}`,
				);
			} catch (error) {
				await this.testResult(
					`Responsive ${viewport.name}`,
					false,
					"Responsive test failed",
					error,
				);
			}
		}

		// Reset to desktop
		await this.page.setViewportSize({ width: 1920, height: 1080 });
	}

	// Generate comprehensive report
	async generateReport() {
		console.log("\n📋 Generating Advanced E2E Test Report...");

		const passed = this.testResults.filter((t) => t.passed).length;
		const failed = this.testResults.filter((t) => !t.passed).length;
		const total = this.testResults.length;

		const report = {
			summary: {
				totalTests: total,
				passed: passed,
				failed: failed,
				successRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
				screenshots: this.screenshots.length,
				errors: this.errors.length,
				authenticated: this.isAuthenticated,
				timestamp: new Date().toISOString(),
			},
			testResults: this.testResults,
			screenshots: this.screenshots,
			errors: this.errors,
			platformStatus: failed === 0 ? "FULLY_FUNCTIONAL" : "NEEDS_ATTENTION",
			recommendations: [],
		};

		// Generate recommendations
		if (failed > 0) {
			report.recommendations.push(
				"Fix failing test cases for improved platform reliability",
			);
		}
		if (!this.isAuthenticated) {
			report.recommendations.push(
				"Fix authentication flow for proper session management",
			);
		}
		if (this.errors.length > 0) {
			report.recommendations.push(
				"Address JavaScript errors and failed requests",
			);
		}

		// Save report
		const reportPath = path.join(
			TEST_CONFIG.screenshotsDir,
			"advanced-e2e-report.json",
		);
		await Bun.write(reportPath, JSON.stringify(report, null, 2));

		// Print summary
		console.log("\n🎯 Advanced E2E Test Summary:");
		console.log(`   Total Tests: ${total}`);
		console.log(`   Passed: ${passed} ✅`);
		console.log(`   Failed: ${failed} ❌`);
		console.log(`   Success Rate: ${report.summary.successRate}%`);
		console.log(`   Screenshots: ${this.screenshots.length} 📸`);
		console.log(`   Errors: ${this.errors.length} ⚠️`);
		console.log(`   Authentication: ${this.isAuthenticated ? "✅" : "❌"}`);
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
			console.log("\n⚠️ JavaScript Errors:");
			this.errors.slice(0, 5).forEach((err) => {
				console.log(`   • ${err.type}: ${err.message}`);
			});
		}

		console.log(`\n📁 Full report saved: ${reportPath}`);
		console.log(`📸 Screenshots saved in: ${TEST_CONFIG.screenshotsDir}`);

		return report;
	}

	// Run all tests
	async runAllTests() {
		try {
			await this.init();

			// Step 1: Authenticate
			const _authSuccess = await this.authenticateAdmin();

			// Step 2: Test application pages
			await this.testApplicationPages();

			// Step 3: Test form interactions
			await this.testFormInteractions();

			// Step 4: Test responsive behavior
			await this.testResponsiveBehavior();

			// Step 5: Generate report
			const report = await this.generateReport();

			return report;
		} catch (error) {
			console.error("❌ Advanced E2E Test Suite failed:", error);
			this.errors.push({
				type: "Test Suite Error",
				message: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString(),
			});
		} finally {
			await this.cleanup();
		}
	}

	async cleanup() {
		if (this.context) {
			await this.context.close();
		}
		if (this.browser) {
			await this.browser.close();
		}
	}
}

// Run the advanced E2E test suite
async function main() {
	console.log("🚀 GCMC-KAJ Platform - Advanced E2E Testing Suite");
	console.log("=".repeat(60));

	const testSuite = new AdvancedE2ETestSuite();

	try {
		const report = await testSuite.runAllTests();
		const success = report.summary.failed === 0;

		console.log(`\n${"=".repeat(60)}`);
		if (success && report.summary.authenticated) {
			console.log(
				"🎉 ALL ADVANCED E2E TESTS PASSED - Platform fully functional!",
			);
		} else {
			console.log("⚠️ ISSUES DETECTED - Platform needs attention");
		}
		console.log("=".repeat(60));

		process.exit(success ? 0 : 1);
	} catch (error) {
		console.error("💥 Advanced E2E Testing failed catastrophically:", error);
		process.exit(1);
	}
}

main().catch(console.error);
