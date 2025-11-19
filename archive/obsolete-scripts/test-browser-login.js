#!/usr/bin/env node

import puppeteer from "puppeteer";

async function testBrowserLogin() {
	const browser = await puppeteer.launch({
		headless: false, // Set to true for headless mode
		defaultViewport: { width: 1280, height: 720 },
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const page = await browser.newPage();

		console.log("📖 Testing browser login flow...");
		console.log("🌍 Navigating to web app...");

		await page.goto("http://localhost:3001", { waitUntil: "networkidle0" });

		// Should redirect to login
		console.log(`📍 Current URL: ${page.url()}`);

		if (!page.url().includes("/login")) {
			throw new Error("Did not redirect to login page");
		}

		console.log("✅ Successfully redirected to login page");

		// Wait for form elements to be available
		await page.waitForSelector('input[type="email"]', { timeout: 10000 });
		await page.waitForSelector('input[type="password"]', { timeout: 10000 });
		await page.waitForSelector('button[type="submit"]', { timeout: 10000 });

		console.log("✅ Login form elements found");

		// Take a screenshot of login page
		await page.screenshot({ path: "login-page-test.png", fullPage: true });
		console.log("📸 Screenshot saved: login-page-test.png");

		// Fill in the login form with our test user
		await page.type('input[type="email"]', "admin@gcmc-kaj.com");
		await page.type('input[type="password"]', "Admin123");

		console.log("✅ Form filled with test credentials");

		// Submit the form
		await page.click('button[type="submit"]');

		console.log("🔄 Login form submitted, waiting for response...");

		// Wait for either redirect or error message
		await Promise.race([
			page.waitForNavigation({ timeout: 15000 }),
			page.waitForSelector(".error", { timeout: 15000 }).catch(() => null),
			page
				.waitForSelector('[data-testid="error"]', { timeout: 15000 })
				.catch(() => null),
		]);

		console.log(`📍 After login URL: ${page.url()}`);

		// Take a screenshot after login attempt
		await page.screenshot({ path: "after-login-test.png", fullPage: true });
		console.log("📸 Screenshot saved: after-login-test.png");

		// Check if we're still on login page (login failed) or redirected (login successful)
		if (page.url().includes("/login")) {
			console.log("⚠️  Still on login page - checking for error messages");

			// Look for error messages
			const errorElements = await page.$$eval("div, span, p", (elements) =>
				elements
					.map((el) => el.textContent?.trim())
					.filter(
						(text) =>
							text &&
							(text.toLowerCase().includes("error") ||
								text.toLowerCase().includes("invalid") ||
								text.toLowerCase().includes("failed") ||
								text.toLowerCase().includes("wrong")),
					),
			);

			if (errorElements.length > 0) {
				console.log("❌ Found error messages:", errorElements);
			} else {
				console.log("🤔 No specific error messages found");
			}
		} else {
			console.log("✅ Login successful - redirected to:", page.url());

			// Check if we can access dashboard elements
			const dashboardElements = await page.$$eval("h1, h2, nav", (elements) =>
				elements.map((el) => el.textContent?.trim()).filter(Boolean),
			);

			console.log(
				"📊 Dashboard elements found:",
				dashboardElements.slice(0, 5),
			);
		}

		return true;
	} catch (error) {
		console.error("❌ Browser test failed:", error.message);
		return false;
	} finally {
		await browser.close();
	}
}

// Run the test
testBrowserLogin()
	.then((success) => {
		console.log(
			success
				? "✅ Browser login test completed"
				: "❌ Browser login test failed",
		);
		process.exit(success ? 0 : 1);
	})
	.catch((error) => {
		console.error("❌ Fatal error:", error);
		process.exit(1);
	});
