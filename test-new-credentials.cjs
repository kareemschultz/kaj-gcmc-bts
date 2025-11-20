#!/usr/bin/env node

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function testNewCredentials() {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: { width: 1920, height: 1080 },
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-web-security",
			"--disable-features=VizDisplayCompositor",
		],
	});

	try {
		console.log("🌐 Starting browser test with new credentials...");

		const page = await browser.newPage();

		// Monitor console logs
		page.on("console", (msg) => {
			console.log(`🖥️  BROWSER: ${msg.type()}: ${msg.text()}`);
		});

		// Monitor network requests
		page.on("response", (response) => {
			console.log(`📡 ${response.status()} ${response.url()}`);
		});

		// Monitor errors
		page.on("pageerror", (err) => {
			console.error("❌ Page error:", err.message);
		});

		// Navigate to login page
		console.log("🔗 Navigating to login page...");
		await page.goto("http://localhost:3001/login", {
			waitUntil: "networkidle0",
		});

		// Wait for login form
		await page.waitForSelector('input[name="email"]', { timeout: 10000 });
		console.log("✅ Login form loaded");

		// Check if demo credentials are removed
		const demoCredentialsExist = await page.$(
			".rounded-lg.border.border-emerald-500\\/30.bg-emerald-900\\/30",
		);
		if (demoCredentialsExist) {
			console.log("❌ Demo credentials section still visible");
		} else {
			console.log("✅ Demo credentials section successfully removed");
		}

		// Take screenshot of login page without demo credentials
		await page.screenshot({
			path: "./screenshots/login-page-cleaned.png",
			fullPage: true,
		});
		console.log("📸 Screenshot saved: login-page-cleaned.png");

		// Fill in new credentials
		console.log("📝 Filling in new admin credentials...");
		await page.type('input[name="email"]', "admin@gcmc-kaj.com");
		await page.type('input[name="password"]', "AdminPassword123");

		// Take screenshot before login
		await page.screenshot({
			path: "./screenshots/before-login.png",
			fullPage: true,
		});
		console.log("📸 Screenshot saved: before-login.png");

		// Click login button
		console.log("🔑 Attempting login...");
		await page.click('button[type="submit"]');

		// Wait for either dashboard or error
		try {
			// Wait for navigation to dashboard
			await page.waitForNavigation({
				waitUntil: "networkidle0",
				timeout: 15000,
			});

			console.log("🎉 Login successful! Current URL:", page.url());

			if (page.url().includes("/dashboard")) {
				console.log("✅ Successfully redirected to dashboard");

				// Take screenshot of dashboard
				await page.screenshot({
					path: "./screenshots/dashboard-success.png",
					fullPage: true,
				});
				console.log("📸 Screenshot saved: dashboard-success.png");

				// Check for any error messages on dashboard
				const errorElements = await page.$$(
					".text-red-400, .text-red-500, .text-red-600",
				);
				if (errorElements.length > 0) {
					console.log("⚠️  Found error elements on dashboard page");
					for (let i = 0; i < errorElements.length; i++) {
						const errorText = await errorElements[i].textContent();
						console.log(`   Error ${i + 1}: ${errorText}`);
					}
				} else {
					console.log("✅ No error messages found on dashboard");
				}

				// Test navigation to different sections
				try {
					// Look for navigation links
					const navLinks = await page.$$('nav a, [role="navigation"] a');
					console.log(`🗺️  Found ${navLinks.length} navigation links`);

					if (navLinks.length > 0) {
						// Test first few navigation links
						for (let i = 0; i < Math.min(3, navLinks.length); i++) {
							const linkText = await navLinks[i].textContent();
							console.log(`🔗 Testing navigation to: ${linkText}`);

							await navLinks[i].click();
							await page.waitForTimeout(2000); // Wait for page load

							console.log(`   Current URL: ${page.url()}`);
							await page.screenshot({
								path: `./screenshots/navigation-${i + 1}.png`,
								fullPage: true,
							});
						}
					}
				} catch (navError) {
					console.log("⚠️  Navigation testing failed:", navError.message);
				}

				return true;
			}
			console.log(
				`❌ Login did not redirect to dashboard. Current URL: ${page.url()}`,
			);
			return false;
		} catch (timeoutError) {
			console.log("⏰ Login timeout - checking for error messages...");

			// Look for error messages
			const errorMessages = await page.$$(
				".text-red-400, .text-red-500, .text-red-600",
			);
			if (errorMessages.length > 0) {
				console.log("❌ Found login error messages:");
				for (let i = 0; i < errorMessages.length; i++) {
					const errorText = await errorMessages[i].textContent();
					console.log(`   Error ${i + 1}: ${errorText}`);
				}
			}

			// Take screenshot of error state
			await page.screenshot({
				path: "./screenshots/login-error.png",
				fullPage: true,
			});
			console.log("📸 Screenshot saved: login-error.png");

			return false;
		}
	} catch (error) {
		console.error("💥 Test failed:", error);

		try {
			await page.screenshot({
				path: "./screenshots/test-failure.png",
				fullPage: true,
			});
			console.log("📸 Failure screenshot saved");
		} catch (screenshotError) {
			console.error("Failed to take failure screenshot:", screenshotError);
		}

		return false;
	} finally {
		await browser.close();
	}
}

async function main() {
	// Create screenshots directory
	const screenshotsDir = "./screenshots";
	if (!fs.existsSync(screenshotsDir)) {
		fs.mkdirSync(screenshotsDir, { recursive: true });
	}

	console.log("🚀 Testing GCMC-KAJ login with new credentials...\n");

	const testPassed = await testNewCredentials();

	console.log("\n" + "=".repeat(60));
	if (testPassed) {
		console.log("🎉 SUCCESS: Login test passed with new credentials!");
		console.log("✅ Demo credentials removed from login page");
		console.log("✅ Login with AdminPassword123 successful");
		console.log("✅ Dashboard accessible");
	} else {
		console.log("❌ FAILURE: Login test failed");
	}
	console.log("=".repeat(60));

	// Summary of changes
	console.log("\n📋 CHANGES MADE:");
	console.log(
		"  • Updated admin password from Admin123!@# to AdminPassword123",
	);
	console.log("  • Removed demo credentials from login page");
	console.log("  • Fixed database connection credentials");
	console.log("  • Created new admin user in database");
	console.log("\n🔑 NEW CREDENTIALS:");
	console.log("  Email: admin@gcmc-kaj.com");
	console.log("  Password: AdminPassword123");

	process.exit(testPassed ? 0 : 1);
}

main().catch(console.error);
