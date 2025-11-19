#!/usr/bin/env node

/**
 * Comprehensive E2E Test with Console Error Capture
 * Tests actual login flow and captures all browser errors/console logs
 */

const puppeteer = require('puppeteer');
const fs = require('node:fs');

console.log('🔍 Starting Comprehensive E2E Test with Error Capture...\n');

async function comprehensiveTest() {
  let browser;

  try {
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show browser so we can see what's happening
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 },
      devtools: true // Open devtools to see console errors
    });

    const page = await browser.newPage();

    // Capture ALL console messages
    const consoleMessages = [];
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
      console.log(`🖥️ [${type.toUpperCase()}] ${text}`);
    });

    // Capture network failures
    const failedRequests = [];
    page.on('requestfailed', (request) => {
      const failure = {
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText || 'Unknown error',
        timestamp: new Date().toISOString()
      };
      failedRequests.push(failure);
      console.log(`❌ Network Failure: ${failure.method} ${failure.url} - ${failure.error}`);
    });

    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', (error) => {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      pageErrors.push(errorInfo);
      console.log(`💥 Page Error: ${error.message}`);
    });

    console.log('\n📍 Step 1: Navigate to homepage...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0', timeout: 10000 });

    console.log(`   Current URL: ${page.url()}`);

    // Take screenshot of current page
    await page.screenshot({ path: 'step1-homepage.png', fullPage: true });
    console.log('   📸 Screenshot: step1-homepage.png');

    console.log('\n📍 Step 2: Wait for login page...');
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`   Final URL: ${finalUrl}`);

    if (finalUrl.includes('/login')) {
      console.log('   ✅ Successfully redirected to login page');
    } else {
      console.log('   ❌ Not redirected to login page!');
    }

    // Take screenshot of login page
    await page.screenshot({ path: 'step2-login-page.png', fullPage: true });
    console.log('   📸 Screenshot: step2-login-page.png');

    console.log('\n📍 Step 3: Fill and submit login form...');

    // Wait for form elements
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 5000 });

    // Fill form
    await page.type('input[type="email"]', 'admin@gcmc-kaj.com');
    await page.type('input[type="password"]', 'Admin123!@#'); // Using the exact password from the page

    console.log('   ✅ Form filled with: admin@gcmc-kaj.com / Admin123!@#');

    // Take screenshot before submission
    await page.screenshot({ path: 'step3-form-filled.png', fullPage: true });
    console.log('   📸 Screenshot: step3-form-filled.png');

    // Submit form and wait for any response
    await page.click('button[type="submit"]');
    console.log('   🔄 Form submitted, waiting for response...');

    // Wait a bit to capture any immediate errors
    await page.waitForTimeout(3000);

    // Take screenshot after submission
    await page.screenshot({ path: 'step4-after-submit.png', fullPage: true });
    console.log('   📸 Screenshot: step4-after-submit.png');

    console.log(`   Post-submit URL: ${page.url()}`);

    // Try to wait for navigation or error messages
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 5000 }),
        page.waitForSelector('.error', { timeout: 5000 }),
        page.waitForSelector('[role="alert"]', { timeout: 5000 })
      ]);
    } catch (e) {
      console.log('   ⏰ No navigation or error elements detected');
    }

    // Final screenshot
    await page.screenshot({ path: 'step5-final-result.png', fullPage: true });
    console.log('   📸 Screenshot: step5-final-result.png');

    console.log('\n📍 Step 4: Analyze results...');

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
      console.log('   ✅ SUCCESS: Login successful!');
    } else if (currentUrl.includes('/login')) {
      console.log('   ❌ FAILED: Still on login page');
    } else {
      console.log('   ❓ UNKNOWN: Unexpected page');
    }

    // Wait 5 more seconds to capture any delayed errors
    console.log('\n📍 Waiting 5 seconds to capture delayed errors...');
    await page.waitForTimeout(5000);

    // Create comprehensive error report
    const report = {
      timestamp: new Date().toISOString(),
      testResult: currentUrl.includes('/dashboard') ? 'SUCCESS' : 'FAILED',
      finalUrl: currentUrl,
      consoleMessages,
      failedRequests,
      pageErrors,
      screenshots: [
        'step1-homepage.png',
        'step2-login-page.png',
        'step3-form-filled.png',
        'step4-after-submit.png',
        'step5-final-result.png'
      ]
    };

    fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(report, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));

    console.log(`\n🎯 Result: ${report.testResult}`);
    console.log(`📍 Final URL: ${report.finalUrl}`);
    console.log(`📧 Console Messages: ${report.consoleMessages.length}`);
    console.log(`❌ Failed Requests: ${report.failedRequests.length}`);
    console.log(`💥 Page Errors: ${report.pageErrors.length}`);

    if (report.consoleMessages.length > 0) {
      console.log('\n🖥️ Console Messages:');
      report.consoleMessages.forEach((msg, i) => {
        console.log(`   ${i+1}. [${msg.type}] ${msg.text}`);
      });
    }

    if (report.failedRequests.length > 0) {
      console.log('\n❌ Failed Requests:');
      report.failedRequests.forEach((req, i) => {
        console.log(`   ${i+1}. ${req.method} ${req.url} - ${req.error}`);
      });
    }

    if (report.pageErrors.length > 0) {
      console.log('\n💥 Page Errors:');
      report.pageErrors.forEach((error, i) => {
        console.log(`   ${i+1}. ${error.message}`);
      });
    }

    console.log(`\n📄 Full report saved: comprehensive-test-report.json`);
    console.log('📸 Screenshots saved: step1-homepage.png, step2-login-page.png, etc.');

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
  } finally {
    if (browser) {
      console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
      setTimeout(async () => {
        await browser.close();
        console.log('🚪 Browser closed');
      }, 10000);
    }
  }
}

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

comprehensiveTest().catch(console.error);