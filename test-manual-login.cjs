const { chromium } = require("playwright");

async function testManualLogin() {
	console.log("🧪 Testing manual login flow...");

	const browser = await chromium.launch({
		headless: false, // Show browser to see what's happening
		slowMo: 1000,
	});

	const page = await browser.newPage();

	try {
		// Navigate to login page
		console.log("📄 Navigating to login page...");
		await page.goto("http://localhost:3001/login");

		// Take screenshot of login page
		await page.screenshot({ path: "login-page-debug.png" });
		console.log("📸 Login page screenshot saved");

		// Check if login form is present
		const emailField = await page.locator('input[name="email"]').first();
		const passwordField = await page.locator('input[name="password"]').first();
		const submitButton = await page.locator('button[type="submit"]').first();

		if (await emailField.isVisible()) {
			console.log("✅ Email field found");
		} else {
			console.log("❌ Email field not found");
			const emailSelectors = [
				'input[type="email"]',
				'[data-testid="email"]',
				"#email",
			];
			for (const selector of emailSelectors) {
				if ((await page.locator(selector).count()) > 0) {
					console.log(`ℹ️  Found alternative email selector: ${selector}`);
				}
			}
		}

		if (await passwordField.isVisible()) {
			console.log("✅ Password field found");
		} else {
			console.log("❌ Password field not found");
		}

		if (await submitButton.isVisible()) {
			console.log("✅ Submit button found");
		} else {
			console.log("❌ Submit button not found");
		}

		// Fill login form
		console.log("📝 Filling login form...");
		await emailField.fill("admin@gcmc-kaj.com");
		await passwordField.fill("AdminPassword123");

		console.log("📸 Taking screenshot before submit...");
		await page.screenshot({ path: "login-form-filled-debug.png" });

		// Submit form
		console.log("🚀 Submitting login form...");
		await submitButton.click();

		// Wait a bit and see what happens
		await page.waitForTimeout(3000);

		const currentUrl = page.url();
		console.log(`📍 Current URL after login: ${currentUrl}`);

		// Take screenshot after submission
		await page.screenshot({ path: "login-after-submit-debug.png" });

		// Check if we're on dashboard or if there are errors
		if (currentUrl.includes("/dashboard")) {
			console.log("✅ Successfully redirected to dashboard!");
			await page.screenshot({ path: "dashboard-success-debug.png" });
		} else {
			console.log("❌ Did not redirect to dashboard");

			// Check for error messages
			const errorElements = await page
				.locator('[role="alert"], .error, .text-red, [data-testid*="error"]')
				.all();
			if (errorElements.length > 0) {
				for (let i = 0; i < errorElements.length; i++) {
					const errorText = await errorElements[i].textContent();
					console.log(`🚨 Error found: ${errorText}`);
				}
			}

			// Check network tab for failed requests
			console.log("🔍 Checking console for errors...");
			const logs = [];
			page.on("console", (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
			page.on("pageerror", (error) =>
				logs.push(`PAGE ERROR: ${error.message}`),
			);

			await page.waitForTimeout(2000);

			if (logs.length > 0) {
				console.log("📋 Console logs:");
				logs.forEach((log) => console.log(`  ${log}`));
			}
		}
	} catch (error) {
		console.error("💥 Test failed:", error.message);
		await page.screenshot({ path: "login-test-error-debug.png" });
	}

	await browser.close();
}

testManualLogin().catch(console.error);
