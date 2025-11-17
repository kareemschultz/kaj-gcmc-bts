#!/usr/bin/env node

/**
 * Quick Platform Screenshots
 * Takes screenshots of the platform in its current state
 */

const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");

async function takeQuickScreenshots() {
	const screenshotsDir =
		"/home/kareem/kaj-gcmc-bts/platform-verification-screenshots";

	console.log("🚀 Taking quick platform screenshots...");

	// Create screenshots directory
	try {
		await fs.mkdir(screenshotsDir, { recursive: true });
	} catch (error) {
		console.log("Screenshots directory already exists");
	}

	// Launch browser
	const browser = await puppeteer.launch({
		headless: true,
		defaultViewport: { width: 1920, height: 1080 },
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const page = await browser.newPage();

		// Screenshot 1: Login page
		console.log("📸 Capturing login page...");
		await page.goto("http://localhost:3001");
		await new Promise((resolve) => setTimeout(resolve, 3000));
		await page.screenshot({
			path: path.join(screenshotsDir, "login-page-verification.png"),
			fullPage: true,
		});

		// Screenshot 2: Try to access dashboard directly (should redirect to login)
		console.log("📸 Checking dashboard access...");
		await page.goto("http://localhost:3001/dashboard");
		await new Promise((resolve) => setTimeout(resolve, 3000));
		await page.screenshot({
			path: path.join(screenshotsDir, "dashboard-redirect-check.png"),
			fullPage: true,
		});

		// Check for any error pages
		console.log("📸 Checking for server errors...");
		const response = await page.goto(
			"http://localhost:3001/api/auth/get-session",
		);
		console.log(`API Response Status: ${response.status()}`);

		await page.screenshot({
			path: path.join(screenshotsDir, "api-status-check.png"),
			fullPage: true,
		});

		// Test responsive design on login
		console.log("📸 Testing responsive login...");
		await page.setViewport({ width: 768, height: 1024 });
		await page.goto("http://localhost:3001");
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await page.screenshot({
			path: path.join(screenshotsDir, "login-tablet-view.png"),
			fullPage: true,
		});

		await page.setViewport({ width: 375, height: 667 });
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await page.screenshot({
			path: path.join(screenshotsDir, "login-mobile-view.png"),
			fullPage: true,
		});

		console.log("✅ Screenshots completed successfully!");
		console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
	} catch (error) {
		console.error("❌ Error taking screenshots:", error);
	} finally {
		await browser.close();
	}
}

takeQuickScreenshots();
