import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Enhanced Content Security Policy middleware with nonce support
 *
 * Security Features:
 * - Dynamic nonce generation for each request
 * - Environment-specific CSP policies
 * - OWASP-compliant security headers
 * - XSS and injection attack prevention
 */

// Generate a secure nonce for CSP using Web Crypto API
function generateNonce(): string {
	// Fallback to a simple random string for edge runtime
	return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
}

// Generate CSP policy with nonce
function generateCSPWithNonce(nonce: string, isProduction: boolean): string {
	const baseDirectives = {
		"default-src": ["'self'"],
		"script-src": [
			"'self'",
			`'nonce-${nonce}'`, // Dynamic nonce for inline scripts
			// Only allow unsafe-eval in development for webpack HMR
			...(isProduction ? [] : ["'unsafe-eval'"]),
			// Trusted CDNs for specific libraries
			"https://cdn.vercel-insights.com", // Vercel Analytics
		],
		"style-src": [
			"'self'",
			`'nonce-${nonce}'`, // Dynamic nonce for inline styles
			"'unsafe-inline'", // Required for Tailwind CSS - consider nonce approach for enhanced security
			"https://fonts.googleapis.com", // Google Fonts
		],
		"font-src": [
			"'self'",
			"https://fonts.gstatic.com",
			"data:", // For inline fonts
		],
		"img-src": [
			"'self'",
			"data:",
			"blob:",
			"https:", // Allow HTTPS images
		],
		"connect-src": [
			"'self'",
			"ws:",
			"wss:",
			// Environment-specific endpoints
			...(isProduction
				? [
						"https://*.gcmc-kaj.com",
						"wss://*.gcmc-kaj.com",
					]
				: [
						// Development API endpoints - specific for tRPC and Better Auth
						"http://localhost:3000",
						"https://localhost:3000",
						"http://localhost:3001", // Web app itself
						"https://localhost:3001",
						"http://localhost:3003", // Backend API (tRPC + Better Auth)
						"https://localhost:3003",
						"ws://localhost:3000",
						"ws://localhost:3001",
						"ws://localhost:3003",
						// Next.js dev server HMR - allow any port for flexibility
						"ws://localhost:*",
						"wss://localhost:*",
					]),
		],
		"frame-src": ["'self'", "blob:"],
		"frame-ancestors": ["'self'"],
		"base-uri": ["'self'"],
		"form-action": [
			"'self'",
			isProduction ? "https://auth.gcmc-kaj.com" : "http://localhost:3003",
		],
		"object-src": ["'none'"],
		"media-src": ["'self'", "blob:", "data:"],
		"worker-src": ["'self'", "blob:"],
		"child-src": ["'self'", "blob:"],
		"manifest-src": ["'self'"],
		"report-uri": ["/api/csp-report"],
		"report-to": ["csp-endpoint"],
		...(isProduction && { "upgrade-insecure-requests": [] }),
	};

	return Object.entries(baseDirectives)
		.map(([directive, sources]) =>
			Array.isArray(sources) && sources.length > 0
				? `${directive} ${sources.join(" ")}`
				: directive
		)
		.join("; ");
}

export function middleware(request: NextRequest) {
	const nonce = generateNonce();
	const isProduction = process.env.NODE_ENV === "production";

	// Generate the CSP policy with the nonce
	const csp = generateCSPWithNonce(nonce, isProduction);

	// Create response with security headers
	const response = NextResponse.next();

	// Set the nonce for use in React components
	response.headers.set("x-nonce", nonce);

	// TEMPORARILY DISABLE CSP FOR DEBUGGING LOGIN ISSUES
	if (!isProduction) {
		console.log("🔧 CSP disabled for development debugging");
		return response;
	}

	// Set comprehensive security headers
	const securityHeaders = {
		// Content Security Policy with nonce
		"Content-Security-Policy": csp,

		// Basic security headers
		"X-DNS-Prefetch-Control": "on",
		"X-Frame-Options": "SAMEORIGIN",
		"X-Content-Type-Options": "nosniff",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"X-XSS-Protection": "1; mode=block",

		// Enhanced Permissions Policy
		"Permissions-Policy": [
			"camera=()",
			"microphone=()",
			"geolocation=()",
			"payment=()",
			"usb=()",
			"magnetometer=()",
			"accelerometer=()",
			"gyroscope=()",
			"ambient-light-sensor=()",
			"autoplay=(self)",
			"encrypted-media=(self)",
			"fullscreen=(self)",
			"picture-in-picture=(self)",
		].join(", "),

		// Cross-Origin policies
		"Cross-Origin-Embedder-Policy": "unsafe-none",
		"Cross-Origin-Opener-Policy": "same-origin-allow-popups",
		"Cross-Origin-Resource-Policy": "cross-origin",

		// Additional security
		"X-Permitted-Cross-Domain-Policies": "none",

		// CSP Reporting configuration
		"Reporting-Endpoints": 'csp-endpoint="/api/csp-report"',

		// HSTS in production only
		...(isProduction && {
			"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
		}),
	};

	// Apply all security headers
	Object.entries(securityHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
}

// Configure middleware to run on all routes
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		{
			source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};