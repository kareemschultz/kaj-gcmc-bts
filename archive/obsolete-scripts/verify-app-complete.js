#!/usr/bin/env node

/**
 * Complete App Verification with Screenshots
 * Tests login functionality and captures visual proof
 */

const puppeteer = require("puppeteer");
const fs = require("node:fs");
const path = require("node:path");

console.log("🔍 Starting Complete App Verification with Screenshots...\n");

const TEST_CONFIG = {
	baseUrl: "http://localhost:3001",
	credentials: {
		// Test the credentials shown on login page
		email: "admin@gcmc-kaj.com",
		password: "Admin123!@#",
	},
};

async function verifyApp() {
	let browser;

	try {
		console.log("🚀 Launching browser...");
		browser = await puppeteer.launch({
			headless: false, // Set to false so you can see what's happening
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
			defaultViewport: { width: 1280, height: 720 },
		});

		const page = await browser.newPage();

		// Test 1: Homepage redirect
		console.log("\n📋 Test 1: Checking homepage redirect to login...");
		await page.goto(TEST_CONFIG.baseUrl, { waitUntil: "networkidle2" });
		await page.waitForTimeout(2000);

		const currentUrl = page.url();
		console.log(`   Current URL: ${currentUrl}`);

		if (currentUrl.includes("/login")) {
			console.log("   ✅ Correctly redirected to login page");
		} else {
			console.log("   ❌ Not redirected to login!");
		}

		// Take screenshot of login page
		await page.screenshot({
			path: "screenshots/01-login-page.png",
			fullPage: true,
		});
		console.log("   📸 Screenshot saved: screenshots/01-login-page.png");

		// Test 2: Check for GCMC-KAJ branding
		console.log("\n📋 Test 2: Checking for GCMC-KAJ branding...");
		const pageContent = await page.content();

		if (pageContent.includes("GCMC-KAJ")) {
			console.log("   ✅ GCMC-KAJ branding found");

			// Check specific elements
			const hasTitle = await page
				.$eval("h1", (el) => el.textContent)
				.catch(() => null);
			console.log(`   Title: ${hasTitle}`);

			const hasTagline = await page
				.$eval("p", (el) => el.textContent)
				.catch(() => null);
			console.log(`   Tagline: ${hasTagline}`);
		} else {
			console.log("   ❌ GCMC-KAJ branding NOT found!");
		}

		// Test 3: Check demo credentials display
		console.log("\n📋 Test 3: Checking if demo credentials are shown...");
		const hasDemoEmail = pageContent.includes("admin@gcmc-kaj.com");
		const hasDemoPassword = pageContent.includes("Admin123");

		console.log(`   Demo email shown: ${hasDemoEmail ? "✅" : "❌"}`);
		console.log(`   Demo password shown: ${hasDemoPassword ? "✅" : "❌"}`);

		// Test 4: Try to login with the credentials
		console.log("\n📋 Test 4: Testing login with demo credentials...");

		// Find and fill email field
		const emailInput = await page.$('input[type="email"]');
		if (emailInput) {
			await emailInput.click({ clickCount: 3 }); // Select all
			await emailInput.type(TEST_CONFIG.credentials.email);
			console.log(`   ✅ Email entered: ${TEST_CONFIG.credentials.email}`);
		} else {
			console.log("   ❌ Email input not found!");
		}

		// Find and fill password field
		const passwordInput = await page.$('input[type="password"]');
		if (passwordInput) {
			await passwordInput.click({ clickCount: 3 }); // Select all
			await passwordInput.type(TEST_CONFIG.credentials.password);
			console.log("   ✅ Password entered");
		} else {
			console.log("   ❌ Password input not found!");
		}

		// Take screenshot before login
		await page.screenshot({
			path: "screenshots/02-login-filled.png",
			fullPage: true,
		});
		console.log("   📸 Screenshot saved: screenshots/02-login-filled.png");

		// Click login button
		const loginButton = await page.$('button[type="submit"]');
		if (loginButton) {
			console.log("   🔐 Clicking login button...");
			await loginButton.click();

			// Wait for navigation or error
			await page.waitForTimeout(3000);

			// Check where we are now
			const afterLoginUrl = page.url();
			console.log(`   After login URL: ${afterLoginUrl}`);

			// Take screenshot after login attempt
			await page.screenshot({
				path: "screenshots/03-after-login.png",
				fullPage: true,
			});
			console.log("   📸 Screenshot saved: screenshots/03-after-login.png");

			// Check for error messages
			const errorElement = await page.$(
				'.error, .text-destructive, [role="alert"]',
			);
			if (errorElement) {
				const errorText = await page.evaluate(
					(el) => el.textContent,
					errorElement,
				);
				console.log(`   ⚠️ Error message found: ${errorText}`);
			}

			// Check if we're on dashboard
			if (afterLoginUrl.includes("/dashboard")) {
				console.log("   ✅ Successfully logged in to dashboard!");
			} else if (afterLoginUrl.includes("/login")) {
				console.log("   ❌ Still on login page - authentication failed!");

				// Check console for errors
				const consoleMessages = [];
				page.on("console", (msg) => consoleMessages.push(msg.text()));

				// Try to get network errors
				const failedRequests = [];
				page.on("requestfailed", (request) => {
					failedRequests.push({
						url: request.url(),
						failure: request.failure().errorText,
					});
				});

				// Log any console errors
				if (consoleMessages.length > 0) {
					console.log("\n   Console messages:");
					consoleMessages.forEach((msg) => console.log(`     - ${msg}`));
				}

				if (failedRequests.length > 0) {
					console.log("\n   Failed requests:");
					failedRequests.forEach((req) =>
						console.log(`     - ${req.url}: ${req.failure}`),
					);
				}
			}
		} else {
			console.log("   ❌ Login button not found!");
		}

		// Test 5: Check page styling
		console.log("\n📋 Test 5: Checking page styling...");
		const hasGradient = await page.$(".bg-gradient-to-br");
		const hasDarkTheme = await page.$(".from-slate-900");
		const hasEmeraldAccent = await page.$(
			".text-emerald-400, .from-emerald-600",
		);

		console.log(`   Gradient background: ${hasGradient ? "✅" : "❌"}`);
		console.log(`   Dark theme: ${hasDarkTheme ? "✅" : "❌"}`);
		console.log(`   Emerald accent: ${hasEmeraldAccent ? "✅" : "❌"}`);

		// Final summary
		console.log("\n" + "=".repeat(60));
		console.log("📊 VERIFICATION COMPLETE");
		console.log("=".repeat(60));
		console.log("\n📸 Screenshots saved in screenshots/ folder");
		console.log("   1. 01-login-page.png - Initial login page");
		console.log("   2. 02-login-filled.png - Login form with credentials");
		console.log("   3. 03-after-login.png - Result after login attempt");

		console.log("\n⚠️ ISSUES TO FIX:");
		if (!pageContent.includes("GCMC-KAJ")) {
			console.log("   ❌ Missing GCMC-KAJ branding");
		}
		if (afterLoginUrl && afterLoginUrl.includes("/login")) {
			console.log("   ❌ Login authentication not working");
		}
	} catch (error) {
		console.error("💥 Verification failed:", error);
	} finally {
		// Keep browser open for manual inspection
		console.log("\n👀 Browser left open for manual inspection.");
		console.log("   Close the browser window when done.");

		// Wait for user to close browser
		if (browser) {
			browser.on("disconnected", () => {
				console.log("Browser closed by user.");
				process.exit(0);
			});
		}
	}
}

// Create screenshots directory
if (!fs.existsSync("screenshots")) {
	fs.mkdirSync("screenshots");
}

// Run verification
verifyApp().catch(console.error);
