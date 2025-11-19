import { chromium } from "playwright";

async function testLogin() {
	console.log("🚀 Starting manual login test...");

	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	try {
		// Navigate to login page
		console.log("📍 Navigating to login page...");
		await page.goto("http://localhost:3001");

		// Wait for page to load
		await page.waitForTimeout(2000);
		console.log("✅ Page loaded, current URL:", page.url());

		// Check if login form elements are present
		console.log("🔍 Checking for login form elements...");

		const emailInput = await page.locator('input[type="email"]').first();
		const passwordInput = await page.locator('input[type="password"]').first();
		const submitButton = await page.locator('button[type="submit"]').first();

		const emailVisible = await emailInput.isVisible();
		const passwordVisible = await passwordInput.isVisible();
		const submitVisible = await submitButton.isVisible();

		console.log("📧 Email input visible:", emailVisible);
		console.log("🔐 Password input visible:", passwordVisible);
		console.log("🚀 Submit button visible:", submitVisible);

		if (!emailVisible || !passwordVisible || !submitVisible) {
			console.error("❌ Login form elements not found!");
			await page.screenshot({ path: "login-error.png" });
			return;
		}

		// Fill in credentials
		console.log("✍️ Filling in credentials...");
		await emailInput.fill("admin@gcmc-kaj.com");
		await passwordInput.fill("Admin123!@#");

		// Wait a moment
		await page.waitForTimeout(1000);

		// Click submit
		console.log("🖱️ Clicking submit button...");
		await submitButton.click();

		// Wait and check what happens
		console.log("⏳ Waiting for response...");

		try {
			// Wait for either success redirect or error message
			await Promise.race([
				page.waitForURL(/dashboard/, { timeout: 10000 }),
				page.waitForURL(/admin/, { timeout: 10000 }),
				page.waitForSelector("[data-sonner-toast]", { timeout: 10000 }),
				page.waitForSelector(".text-red", { timeout: 10000 }),
			]);

			console.log("📍 After login attempt, URL:", page.url());

			// Check for success
			if (page.url().includes("dashboard") || page.url().includes("admin")) {
				console.log("🎉 SUCCESS: Redirected to dashboard!");
			} else {
				console.log("⚠️ Still on login page, checking for errors...");

				// Look for error messages
				const errorText = await page.textContent("body");
				console.log(
					"📄 Page content contains:",
					`${errorText.substring(0, 200)}...`,
				);

				// Take screenshot for debugging
				await page.screenshot({ path: "login-attempt.png" });
			}
		} catch (timeoutError) {
			console.log("⏰ Timeout waiting for response");
			console.log("📍 Final URL:", page.url());

			// Take screenshot
			await page.screenshot({ path: "login-timeout.png" });

			// Check for any console errors
			const consoleMessages = [];
			page.on("console", (msg) => consoleMessages.push(msg.text()));

			if (consoleMessages.length > 0) {
				console.log("🖥️ Console messages:", consoleMessages);
			}
		}

		// Wait a bit more to see final state
		await page.waitForTimeout(3000);
	} catch (error) {
		console.error("❌ Test failed:", error.message);
		await page.screenshot({ path: "test-error.png" });
	} finally {
		await browser.close();
	}
}

// Run the test
testLogin();
