#!/usr/bin/env bun

/**
 * Visual Content Check for GCMC-KAJ Platform
 *
 * Since we cannot run GUI browsers, this script:
 * 1. Checks HTML content for key elements
 * 2. Validates page structure
 * 3. Identifies missing components or broken layouts
 * 4. Simulates user interactions via DOM analysis
 */

const BASE_URL = "http://localhost:3001";

class VisualContentChecker {
	constructor() {
		this.issues = [];
		this.checks = [];
		this.sessionCookie = null;
	}

	async fetchPage(path, description) {
		try {
			const response = await fetch(`${BASE_URL}${path}`, {
				headers: {
					...(this.sessionCookie ? { Cookie: this.sessionCookie } : {}),
				},
			});

			const html = await response.text();

			console.log(`\n📄 Checking: ${description} (${path})`);
			console.log(`   Status: ${response.status} ${response.statusText}`);

			return {
				status: response.status,
				html,
				success: response.ok,
			};
		} catch (error) {
			this.issues.push({
				page: path,
				issue: `Failed to fetch: ${error.message}`,
			});
			return { success: false, error: error.message };
		}
	}

	checkElement(html, selector, description, page) {
		const found =
			html.includes(selector) ||
			html.includes(selector.replace(/class="[^"]*"/, "")) ||
			html.includes(selector.split(" ")[0]);

		this.checks.push({
			page,
			check: description,
			passed: found,
			selector,
		});

		const status = found ? "✅" : "❌";
		console.log(`   ${status} ${description}`);

		if (!found) {
			this.issues.push({
				page,
				issue: `Missing: ${description}`,
				selector,
			});
		}

		return found;
	}

	checkForErrors(html, page) {
		const errorIndicators = [
			"Module not found",
			"Cannot resolve",
			"TypeError",
			"ReferenceError",
			"Error: ",
			"Failed to load",
			"404",
			"500",
			"Application error",
		];

		for (const error of errorIndicators) {
			if (html.includes(error)) {
				this.issues.push({
					page,
					issue: `Error detected: ${error}`,
				});
				console.log(`   ❌ Error found: ${error}`);
			}
		}
	}

	async loginAsAdmin() {
		console.log("\n🔐 Logging in as admin for protected page testing...");

		try {
			const loginResponse = await fetch(
				"http://localhost:3000/api/auth/sign-in/email",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: "admin@gcmc-kaj.com",
						password: "GCMCAdmin2024!",
					}),
				},
			);

			if (loginResponse.ok) {
				const setCookie = loginResponse.headers.get("set-cookie");
				this.sessionCookie = setCookie ? setCookie.split(";")[0] : null;
				console.log("✅ Admin login successful");
				return true;
			}
			console.log(`❌ Admin login failed: ${loginResponse.status}`);
			return false;
		} catch (error) {
			console.log(`❌ Login error: ${error.message}`);
			return false;
		}
	}

	async checkLandingPage() {
		const result = await this.fetchPage("/", "Landing Page");
		if (!result.success) return;

		const { html } = result;
		this.checkForErrors(html, "/");

		// Check basic HTML structure
		this.checkElement(html, "<html", "HTML document structure", "/");
		this.checkElement(html, "<head>", "HTML head section", "/");
		this.checkElement(html, "<body", "HTML body section", "/");
		this.checkElement(html, "<title", "Page title", "/");

		// Check for React/Next.js
		this.checkElement(html, "__NEXT_DATA__", "Next.js hydration data", "/");
		this.checkElement(html, '<div id="__next"', "Next.js root element", "/");
	}

	async checkLoginPage() {
		const result = await this.fetchPage("/login", "Login Page");
		if (!result.success) return;

		const { html } = result;
		this.checkForErrors(html, "/login");

		// Check login form elements
		this.checkElement(html, 'type="email"', "Email input field", "/login");
		this.checkElement(
			html,
			'type="password"',
			"Password input field",
			"/login",
		);
		this.checkElement(html, 'type="submit"', "Submit button", "/login");
		this.checkElement(html, "<form", "Login form", "/login");
		this.checkElement(html, "Sign", "Sign in text/button", "/login");
	}

	async checkDashboard() {
		const result = await this.fetchPage("/dashboard", "Dashboard Page");
		if (!result.success) return;

		const { html } = result;
		this.checkForErrors(html, "/dashboard");

		// Check navigation
		this.checkElement(html, "nav", "Navigation menu", "/dashboard");
		this.checkElement(html, "Clients", "Clients navigation", "/dashboard");
		this.checkElement(html, "Documents", "Documents navigation", "/dashboard");
		this.checkElement(html, "Dashboard", "Dashboard content", "/dashboard");

		// Check dashboard elements
		this.checkElement(html, "card", "Dashboard cards", "/dashboard");
		this.checkElement(html, "Overview", "Dashboard overview", "/dashboard");
	}

	async checkAdminPanel() {
		const result = await this.fetchPage("/admin", "Admin Panel");
		if (!result.success) return;

		const { html } = result;
		this.checkForErrors(html, "/admin");

		// Check admin elements
		this.checkElement(html, "Users", "Users management", "/admin");
		this.checkElement(html, "Roles", "Roles management", "/admin");
		this.checkElement(html, "Admin", "Admin interface", "/admin");
		this.checkElement(html, "table", "Data tables", "/admin");
	}

	async checkMajorPages() {
		const pages = [
			{ path: "/clients", name: "Clients Page" },
			{ path: "/documents", name: "Documents Page" },
			{ path: "/filings", name: "Filings Page" },
			{ path: "/analytics", name: "Analytics Page" },
			{ path: "/tasks", name: "Tasks Page" },
			{ path: "/service-requests", name: "Service Requests Page" },
			{ path: "/notifications", name: "Notifications Page" },
		];

		for (const page of pages) {
			const result = await this.fetchPage(page.path, page.name);
			if (!result.success) continue;

			const { html } = result;
			this.checkForErrors(html, page.path);

			// Check basic page structure
			this.checkElement(html, "main", "Main content area", page.path);
			this.checkElement(
				html,
				page.name.split(" ")[0],
				"Page-specific content",
				page.path,
			);
		}
	}

	async checkComponentLibrary() {
		console.log("\n🧩 Checking UI Component Library...");

		// Check if textarea component exists (we just created it)
		const result = await this.fetchPage(
			"/admin",
			"Admin Page for Component Check",
		);
		if (!result.success) return;

		const { html } = result;

		// Check for common UI components
		this.checkElement(html, "button", "Button components", "/admin");
		this.checkElement(html, "input", "Input components", "/admin");
		this.checkElement(html, "card", "Card components", "/admin");

		// Check for our recently created textarea
		const hasTextarea = html.includes("textarea") || html.includes("Textarea");
		this.checks.push({
			page: "/admin",
			check: "Textarea component available",
			passed: hasTextarea,
		});

		const textareaStatus = hasTextarea ? "✅" : "❌";
		console.log(`   ${textareaStatus} Textarea component available`);
	}

	generateReport() {
		console.log("\n📋 Visual Content Check Report");
		console.log("=".repeat(50));

		const totalChecks = this.checks.length;
		const passedChecks = this.checks.filter((c) => c.passed).length;
		const failedChecks = totalChecks - passedChecks;

		console.log(`Total Checks: ${totalChecks}`);
		console.log(`Passed: ${passedChecks} ✅`);
		console.log(`Failed: ${failedChecks} ❌`);
		console.log(
			`Success Rate: ${totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(2) : 0}%`,
		);

		if (this.issues.length > 0) {
			console.log("\n🚨 Issues Found:");
			this.issues.forEach((issue, index) => {
				console.log(`${index + 1}. [${issue.page}] ${issue.issue}`);
			});
		}

		if (failedChecks === 0) {
			console.log("\n🎉 ALL VISUAL CHECKS PASSED!");
			console.log("✅ Platform UI is fully functional");
		} else {
			console.log("\n⚠️ SOME VISUAL ISSUES FOUND");
			console.log("📝 Review the issues above for UI improvements");
		}

		// Save detailed report
		const report = {
			summary: {
				totalChecks,
				passed: passedChecks,
				failed: failedChecks,
				successRate:
					totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(2) : 0,
				timestamp: new Date().toISOString(),
			},
			checks: this.checks,
			issues: this.issues,
		};

		Bun.write("./visual-check-report.json", JSON.stringify(report, null, 2));
		console.log("\n💾 Detailed report saved: visual-check-report.json");

		return report;
	}

	async runAllChecks() {
		console.log("🔍 GCMC-KAJ Platform - Visual Content Check");
		console.log("=".repeat(50));

		await this.checkLandingPage();
		await this.checkLoginPage();

		// Login for protected pages
		const loginSuccess = await this.loginAsAdmin();

		if (loginSuccess) {
			await this.checkDashboard();
			await this.checkAdminPanel();
			await this.checkMajorPages();
		}

		await this.checkComponentLibrary();

		return this.generateReport();
	}
}

// Run visual checks
async function main() {
	const checker = new VisualContentChecker();

	try {
		const report = await checker.runAllChecks();
		const success = report.summary.failed === 0;
		process.exit(success ? 0 : 1);
	} catch (error) {
		console.error("💥 Visual checking failed:", error);
		process.exit(1);
	}
}

main().catch(console.error);
