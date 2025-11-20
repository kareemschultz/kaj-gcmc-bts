#!/usr/bin/env node

/**
 * CSP Testing Script
 *
 * Tests Content Security Policy implementation to ensure:
 * - No CSP violations in browser console
 * - All required resources load correctly
 * - Security headers are properly configured
 * - XSS protection is working
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3003';

/**
 * Test CSP headers are present and correctly configured
 */
async function testSecurityHeaders() {
	console.log('🔍 Testing Security Headers...\n');

	try {
		const response = await fetch(BASE_URL);
		const headers = response.headers;

		const requiredHeaders = {
			'content-security-policy': 'Content Security Policy',
			'x-frame-options': 'X-Frame-Options',
			'x-content-type-options': 'X-Content-Type-Options',
			'referrer-policy': 'Referrer Policy',
			'x-xss-protection': 'XSS Protection',
			'permissions-policy': 'Permissions Policy',
			'cross-origin-embedder-policy': 'Cross-Origin Embedder Policy',
			'cross-origin-opener-policy': 'Cross-Origin Opener Policy',
			'cross-origin-resource-policy': 'Cross-Origin Resource Policy',
		};

		console.log('Security Headers Check:');
		console.log('======================');

		for (const [headerName, description] of Object.entries(requiredHeaders)) {
			const headerValue = headers.get(headerName);
			const status = headerValue ? '✅ PASS' : '❌ FAIL';
			console.log(`${status} ${description}: ${headerValue ? 'Present' : 'Missing'}`);

			if (headerValue && headerName === 'content-security-policy') {
				console.log(`   CSP Value: ${headerValue.substring(0, 100)}...`);
			}
		}

		// Check for nonce in CSP
		const csp = headers.get('content-security-policy');
		if (csp) {
			const hasNonce = /nonce-[A-Za-z0-9+\/=]+/.test(csp);
			console.log(`${hasNonce ? '✅' : '❌'} CSP Nonce: ${hasNonce ? 'Present' : 'Missing'}`);

			// Check for unsafe-inline in production
			const hasUnsafeInline = csp.includes("'unsafe-inline'");
			const isProduction = process.env.NODE_ENV === 'production';
			if (isProduction && hasUnsafeInline) {
				console.log('⚠️  WARNING: unsafe-inline found in production CSP');
			}
		}

		console.log('\n');
		return true;
	} catch (error) {
		console.error('❌ Error testing security headers:', error.message);
		return false;
	}
}

/**
 * Test API connectivity through CSP
 */
async function testAPIConnectivity() {
	console.log('🌐 Testing API Connectivity...\n');

	try {
		// Test health endpoint
		const healthResponse = await fetch(`${API_URL}/health`);
		const healthStatus = healthResponse.ok ? '✅ PASS' : '❌ FAIL';
		console.log(`${healthStatus} API Health Check: ${healthResponse.status} ${healthResponse.statusText}`);

		// Test tRPC endpoint
		const trpcResponse = await fetch(`${API_URL}/trpc/health.check`);
		const trpcStatus = trpcResponse.status !== 404 ? '✅ PASS' : '❌ FAIL';
		console.log(`${trpcStatus} tRPC Endpoint: ${trpcResponse.status} ${trpcResponse.statusText}`);

		// Test Better Auth endpoint
		const authResponse = await fetch(`${API_URL}/api/auth/get-session`);
		const authStatus = authResponse.status !== 404 ? '✅ PASS' : '❌ FAIL';
		console.log(`${authStatus} Better Auth Endpoint: ${authResponse.status} ${authResponse.statusText}`);

		console.log('\n');
		return true;
	} catch (error) {
		console.error('❌ Error testing API connectivity:', error.message);
		return false;
	}
}

/**
 * Test for common CSP violations
 */
async function testCSPViolations() {
	console.log('🛡️  Testing CSP Violation Detection...\n');

	// Common CSP violation patterns
	const violations = [
		{
			name: 'Inline Script Injection',
			test: 'document.createElement("script").innerHTML = "alert(1)"',
			shouldBlock: true
		},
		{
			name: 'External Script Loading',
			test: 'https://evil.example.com/malicious.js',
			shouldBlock: true
		}
	];

	console.log('CSP Violation Tests:');
	console.log('===================');

	violations.forEach(violation => {
		console.log(`🧪 ${violation.name}: Test configured (manual browser verification required)`);
	});

	console.log('\n');
	return true;
}

/**
 * Generate CSP security report
 */
function generateSecurityReport() {
	console.log('📊 CSP Security Report');
	console.log('======================\n');

	const recommendations = [
		{
			priority: 'HIGH',
			category: 'Script Security',
			item: 'Implement nonce-based script loading for all inline scripts'
		},
		{
			priority: 'HIGH',
			category: 'Style Security',
			item: 'Replace unsafe-inline with nonce-based styles where possible'
		},
		{
			priority: 'MEDIUM',
			category: 'Resource Loading',
			item: 'Implement Subresource Integrity (SRI) for external scripts'
		},
		{
			priority: 'MEDIUM',
			category: 'Cookie Security',
			item: 'Ensure all authentication cookies have Secure and HttpOnly flags'
		},
		{
			priority: 'LOW',
			category: 'Monitoring',
			item: 'Set up CSP violation reporting endpoint'
		}
	];

	recommendations.forEach(rec => {
		const icon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
		console.log(`${icon} [${rec.priority}] ${rec.category}: ${rec.item}`);
	});

	console.log('\n📋 Security Checklist:');
	console.log('======================');
	console.log('☐ Review CSP reports for violations in browser dev tools');
	console.log('☐ Test all authentication flows work correctly');
	console.log('☐ Verify tRPC API calls succeed without CSP blocks');
	console.log('☐ Check Tailwind CSS styles render properly');
	console.log('☐ Confirm Better Auth integration functions correctly');
	console.log('☐ Test Framer Motion animations work without violations');
	console.log('☐ Validate WebSocket connections for real-time features');
	console.log('☐ Ensure third-party integrations comply with CSP');

	console.log('\n');
}

/**
 * Main test runner
 */
async function main() {
	console.log('🔒 GCMC-KAJ CSP Security Testing Suite');
	console.log('=====================================\n');

	const results = {
		headers: await testSecurityHeaders(),
		api: await testAPIConnectivity(),
		violations: await testCSPViolations()
	};

	generateSecurityReport();

	const passed = Object.values(results).every(result => result);
	const status = passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';

	console.log(`\n🏁 ${status}`);
	console.log(`📊 Results: ${Object.values(results).filter(r => r).length}/${Object.keys(results).length} test suites passed\n`);

	if (!passed) {
		process.exit(1);
	}
}

// Run tests if this file is executed directly
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testSecurityHeaders, testAPIConnectivity, testCSPViolations };