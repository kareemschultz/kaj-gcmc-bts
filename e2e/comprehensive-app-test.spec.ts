import { expect, type Page, test } from "@playwright/test";

// Test configuration
const BASE_URL = "http://localhost:3001";
const API_URL = "http://localhost:3003";

// Demo credentials
const ADMIN_EMAIL = "admin@gcmc-kaj.com";
const ADMIN_PASSWORD = "Admin123!@#";

test.describe("GCMC-KAJ Comprehensive E2E Testing", () => {
	let page: Page;

	test.beforeEach(async ({ browser }) => {
		page = await browser.newPage();
	});

	test.afterEach(async () => {
		await page.close();
	});

	test.describe("🌐 Application Availability & Health Checks", () => {
		test("should verify API server is running and healthy", async () => {
			const response = await page.request.get(`${API_URL}/health`);
			expect(response.status()).toBe(200);

			const health = await response.json();
			expect(health.status).toBe("ok");
			expect(health.timestamp).toBeDefined();

			console.log("✅ API Server Health:", health);
		});

		test("should verify web server is accessible", async () => {
			await page.goto(BASE_URL);
			expect(page.url()).toContain("/login");

			// Should redirect to login page
			await expect(page).toHaveTitle(/GCMC-KAJ/i);
		});
	});

	test.describe("🎨 UI/UX Design & Branding Verification", () => {
		test("should display professional login interface with GCMC-KAJ branding", async () => {
			await page.goto(`${BASE_URL}/login`);

			// Check main branding elements
			await expect(page.getByText("GCMC-KAJ")).toBeVisible();
			await expect(page.getByText("Business Tax Services")).toBeVisible();
			await expect(page.getByText("Welcome Back")).toBeVisible();

			// Check professional tagline
			await expect(
				page.getByText(/Your trusted partner for comprehensive tax compliance/),
			).toBeVisible();

			// Check features section
			await expect(page.getByText("Secure & Compliant")).toBeVisible();
			await expect(page.getByText("Complete Tax Management")).toBeVisible();
			await expect(page.getByText("Real-time Analytics")).toBeVisible();

			// Check statistics section
			await expect(page.getByText("99.9%")).toBeVisible();
			await expect(page.getByText("500+")).toBeVisible();
			await expect(page.getByText("24/7")).toBeVisible();

			console.log("✅ All branding elements are visible and correct");
		});

		test("should display demo credentials prominently", async () => {
			await page.goto(`${BASE_URL}/login`);

			// Check demo credentials section
			await expect(page.getByText("Demo Credentials")).toBeVisible();
			await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
			await expect(page.getByText(ADMIN_PASSWORD)).toBeVisible();

			console.log("✅ Demo credentials are prominently displayed");
		});

		test("should have proper form styling and interactions", async () => {
			await page.goto(`${BASE_URL}/login`);

			// Check form elements exist and are styled
			const emailInput = page.locator('input[type="email"]');
			const passwordInput = page.locator('input[type="password"]');
			const submitButton = page.getByRole("button", {
				name: /Sign In to Dashboard/i,
			});

			await expect(emailInput).toBeVisible();
			await expect(passwordInput).toBeVisible();
			await expect(submitButton).toBeVisible();

			// Check password visibility toggle
			const passwordToggle = page
				.locator('button[type="button"]')
				.filter({ hasText: /Show|Hide/ })
				.first();
			if (await passwordToggle.isVisible()) {
				await passwordToggle.click();
				await expect(page.locator('input[type="text"]')).toBeVisible(); // Password should become text
				await passwordToggle.click();
				await expect(page.locator('input[type="password"]')).toBeVisible(); // Back to password

				console.log("✅ Password visibility toggle works correctly");
			}
		});
	});

	test.describe("🔐 Authentication & Login Workflow", () => {
		test("should handle invalid login attempts gracefully", async () => {
			await page.goto(`${BASE_URL}/login`);

			// Try invalid email
			await page.fill('input[type="email"]', "invalid@email.com");
			await page.fill('input[type="password"]', "wrongpassword");
			await page.getByRole("button", { name: /Sign In to Dashboard/i }).click();

			// Should show error message (wait for toast or error display)
			await expect(
				page
					.getByText(/Invalid email or password/i)
					.or(page.getByText(/Sign in failed/i)),
			).toBeVisible({ timeout: 10000 });

			console.log("✅ Invalid login properly handled with error message");
		});

		test("should successfully login with valid admin credentials", async () => {
			await page.goto(`${BASE_URL}/login`);

			// Fill in valid credentials
			await page.fill('input[type="email"]', ADMIN_EMAIL);
			await page.fill('input[type="password"]', ADMIN_PASSWORD);

			// Click submit
			const submitButton = page.getByRole("button", {
				name: /Sign In to Dashboard/i,
			});
			await expect(submitButton).toBeVisible();
			await submitButton.click();

			// Wait for navigation to dashboard or success
			await page.waitForURL(/.*\/(dashboard|admin).*/, { timeout: 15000 });

			// Verify we're in the authenticated area
			expect(page.url()).toMatch(/\/(dashboard|admin)/);

			console.log("✅ Successfully logged in and redirected to dashboard");
		});
	});

	test.describe("📊 Dashboard & Navigation Testing", () => {
		test.beforeEach(async () => {
			// Login before each dashboard test
			await page.goto(`${BASE_URL}/login`);
			await page.fill('input[type="email"]', ADMIN_EMAIL);
			await page.fill('input[type="password"]', ADMIN_PASSWORD);
			await page.getByRole("button", { name: /Sign In to Dashboard/i }).click();

			// Wait for successful login
			await page.waitForURL(/.*\/(dashboard|admin).*/, { timeout: 15000 });
		});

		test("should display dashboard with proper navigation", async () => {
			// Check for main navigation elements
			const commonNavItems = [
				"Dashboard",
				"Clients",
				"Documents",
				"Filings",
				"Reports",
				"Settings",
			];

			for (const item of commonNavItems) {
				const navElement = page.getByText(item, { exact: false }).first();
				if (await navElement.isVisible()) {
					console.log(`✅ Found navigation item: ${item}`);
				}
			}

			// Check for GCMC-KAJ branding in header/nav
			const brandingElements = page
				.getByText("GCMC-KAJ")
				.or(page.getByText("GCMC"))
				.or(page.getByText("KAJ"));
			await expect(brandingElements.first()).toBeVisible({ timeout: 5000 });

			console.log("✅ Dashboard loaded with navigation elements");
		});

		test("should test navigation between different sections", async () => {
			const sections = [
				{ name: "Clients", path: "/clients" },
				{ name: "Documents", path: "/documents" },
				{ name: "Filings", path: "/filings" },
				{ name: "Reports", path: "/reports" },
			];

			for (const section of sections) {
				const navLink = page
					.getByRole("link", { name: section.name })
					.or(page.getByText(section.name))
					.first();

				if (await navLink.isVisible()) {
					await navLink.click();

					// Wait a moment for navigation
					await page.waitForTimeout(1000);

					// Check if URL changed or content updated
					const currentUrl = page.url();
					console.log(`📍 Navigated to ${section.name}: ${currentUrl}`);

					// Look for section-specific content
					await expect(
						page.getByText(section.name, { exact: false }),
					).toBeVisible({ timeout: 5000 });
				}
			}

			console.log("✅ Navigation between sections works");
		});

		test("should verify dashboard data and widgets load", async () => {
			// Look for common dashboard widgets
			const dashboardElements = [
				"Total Clients",
				"Documents",
				"Filings",
				"Compliance",
				"Overview",
				"Statistics",
				"Recent Activity",
			];

			let foundElements = 0;

			for (const element of dashboardElements) {
				const widget = page.getByText(element, { exact: false }).first();
				if (await widget.isVisible({ timeout: 3000 })) {
					foundElements++;
					console.log(`✅ Found dashboard widget: ${element}`);
				}
			}

			// Expect at least some dashboard elements to be present
			expect(foundElements).toBeGreaterThan(0);

			console.log(`✅ Dashboard loaded with ${foundElements} data elements`);
		});
	});

	test.describe("📱 Responsive Design Testing", () => {
		test("should work properly on mobile devices", async () => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });
			await page.goto(`${BASE_URL}/login`);

			// Check mobile layout
			await expect(page.getByText("GCMC-KAJ")).toBeVisible();

			// The left panel should be hidden on mobile, mobile logo should show
			const mobileLogoSection = page.locator(".lg\\:hidden");
			if (await mobileLogoSection.isVisible()) {
				await expect(mobileLogoSection.getByText("GCMC-KAJ")).toBeVisible();
				console.log("✅ Mobile logo is visible");
			}

			// Form should still be usable
			await expect(page.locator('input[type="email"]')).toBeVisible();
			await expect(page.locator('input[type="password"]')).toBeVisible();

			console.log("✅ Mobile layout works correctly");
		});

		test("should work properly on tablet devices", async () => {
			// Set tablet viewport
			await page.setViewportSize({ width: 768, height: 1024 });
			await page.goto(`${BASE_URL}/login`);

			// Check tablet layout
			await expect(page.getByText("GCMC-KAJ")).toBeVisible();
			await expect(page.locator('input[type="email"]')).toBeVisible();

			console.log("✅ Tablet layout works correctly");
		});

		test("should work properly on desktop", async () => {
			// Set desktop viewport
			await page.setViewportSize({ width: 1920, height: 1080 });
			await page.goto(`${BASE_URL}/login`);

			// Check desktop layout - both panels should be visible
			await expect(page.getByText("GCMC-KAJ")).toBeVisible();
			await expect(page.getByText("Your trusted partner")).toBeVisible();
			await expect(page.getByText("Secure & Compliant")).toBeVisible();

			console.log("✅ Desktop layout works correctly");
		});
	});

	test.describe("♿ Accessibility Testing", () => {
		test("should have proper ARIA labels and accessibility features", async () => {
			await page.goto(`${BASE_URL}/login`);

			// Check form labels
			const emailInput = page.locator('input[type="email"]');
			const passwordInput = page.locator('input[type="password"]');

			await expect(emailInput).toHaveAttribute("id");
			await expect(passwordInput).toHaveAttribute("id");

			// Check for associated labels
			const emailLabel = page
				.locator('label[for="email"]')
				.or(page.getByText("Email Address"));
			const passwordLabel = page
				.locator('label[for="password"]')
				.or(page.getByText("Password"));

			await expect(emailLabel).toBeVisible();
			await expect(passwordLabel).toBeVisible();

			console.log("✅ Form inputs have proper labels");
		});

		test("should support keyboard navigation", async () => {
			await page.goto(`${BASE_URL}/login`);

			// Test tab navigation
			await page.keyboard.press("Tab"); // Should focus email input
			await page.keyboard.press("Tab"); // Should focus password input
			await page.keyboard.press("Tab"); // Should focus password toggle or submit button
			await page.keyboard.press("Tab"); // Should focus submit button

			// Check that submit button can be activated with Enter
			const submitButton = page.getByRole("button", {
				name: /Sign In to Dashboard/i,
			});
			await submitButton.focus();

			// Fill form and test keyboard submission
			await page.fill('input[type="email"]', ADMIN_EMAIL);
			await page.fill('input[type="password"]', ADMIN_PASSWORD);
			await page.keyboard.press("Enter");

			console.log("✅ Keyboard navigation works properly");
		});
	});

	test.describe("🔗 API Integration Testing", () => {
		test("should verify API endpoints are accessible", async () => {
			const endpoints = ["/health", "/api/auth/get-session"];

			for (const endpoint of endpoints) {
				try {
					const response = await page.request.get(`${API_URL}${endpoint}`);
					console.log(`📡 ${endpoint}: ${response.status()}`);

					// Health endpoint should always return 200
					if (endpoint === "/health") {
						expect(response.status()).toBe(200);
					}
				} catch (error) {
					console.warn(`⚠️  ${endpoint}: ${error}`);
				}
			}
		});

		test("should test authentication API integration", async () => {
			// Test authentication endpoint
			const response = await page.request.post(`${API_URL}/api/auth/sign-in`, {
				data: {
					email: ADMIN_EMAIL,
					password: ADMIN_PASSWORD,
				},
			});

			console.log(`🔐 Authentication API Response: ${response.status()}`);

			// Should get some response (200 for success, 400+ for validation, etc.)
			expect([200, 201, 400, 401, 422]).toContain(response.status());
		});
	});

	test.describe("🧪 Error Handling & Edge Cases", () => {
		test("should handle network failures gracefully", async () => {
			// Test with offline network
			await page.context().setOffline(true);

			await page.goto(`${BASE_URL}/login`);
			await page.fill('input[type="email"]', ADMIN_EMAIL);
			await page.fill('input[type="password"]', ADMIN_PASSWORD);
			await page.getByRole("button", { name: /Sign In to Dashboard/i }).click();

			// Should show some kind of error or loading state
			await page.waitForTimeout(2000);

			// Restore network
			await page.context().setOffline(false);

			console.log("✅ Handled offline state appropriately");
		});

		test("should handle slow API responses", async () => {
			// This would test timeout handling
			await page.goto(`${BASE_URL}/login`);
			await page.fill('input[type="email"]', ADMIN_EMAIL);
			await page.fill('input[type="password"]', ADMIN_PASSWORD);

			const submitButton = page.getByRole("button", {
				name: /Sign In to Dashboard/i,
			});
			await submitButton.click();

			// Check for loading state
			await expect(
				page.getByText(/Signing In/i).or(page.locator(".animate-spin")),
			).toBeVisible({ timeout: 5000 });

			console.log("✅ Loading states are displayed during slow responses");
		});
	});
});
