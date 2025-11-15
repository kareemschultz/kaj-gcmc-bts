/**
 * Security Headers Middleware
 *
 * Adds comprehensive security headers to all HTTP responses
 * to protect against common web vulnerabilities
 */

import type { Context, Next } from "hono";

/**
 * Content Security Policy configuration
 *
 * Restricts the sources from which various types of content can be loaded
 * Prevents XSS, clickjacking, and other code injection attacks
 */
function getCSPHeader(env: string): string {
	// In development, allow more permissive policies for hot reloading, etc.
	const isDevelopment = env === "development";

	const directives = [
		"default-src 'self'",
		// Scripts: self + inline scripts (needed for Next.js)
		isDevelopment
			? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
			: "script-src 'self' 'unsafe-inline'",
		// Styles: self + inline styles (needed for styled-components, etc.)
		"style-src 'self' 'unsafe-inline'",
		// Images: self + data URIs + blob URLs
		"img-src 'self' data: blob: https:",
		// Fonts: self + data URIs
		"font-src 'self' data:",
		// Connect: self (for API calls)
		isDevelopment ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
		// Media: self
		"media-src 'self'",
		// Objects: none (prevent Flash, Java applets, etc.)
		"object-src 'none'",
		// Frames: self (allow embedding own content)
		"frame-src 'self'",
		// Base URI: restrict to self
		"base-uri 'self'",
		// Form actions: self
		"form-action 'self'",
		// Frame ancestors: none (prevent clickjacking)
		"frame-ancestors 'none'",
		// Upgrade insecure requests in production
		...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
	];

	return directives.join("; ");
}

/**
 * Security headers middleware
 */
export function securityHeaders() {
	return async (c: Context, next: Next) => {
		const env = process.env.NODE_ENV || "development";

		// Call next first to allow downstream handlers to set headers
		await next();

		// Content Security Policy
		c.header("Content-Security-Policy", getCSPHeader(env));

		// Prevent MIME type sniffing
		c.header("X-Content-Type-Options", "nosniff");

		// Enable XSS protection (legacy browsers)
		c.header("X-XSS-Protection", "1; mode=block");

		// Prevent clickjacking
		c.header("X-Frame-Options", "DENY");

		// Referrer Policy - control referrer information
		c.header("Referrer-Policy", "strict-origin-when-cross-origin");

		// Permissions Policy - restrict browser features
		c.header(
			"Permissions-Policy",
			[
				"camera=()",
				"microphone=()",
				"geolocation=()",
				"interest-cohort=()", // Disable FLoC
				"payment=()",
				"usb=()",
			].join(", "),
		);

		// HTTP Strict Transport Security (HSTS) - only in production
		if (env === "production") {
			// Force HTTPS for 1 year, including subdomains
			c.header(
				"Strict-Transport-Security",
				"max-age=31536000; includeSubDomains; preload",
			);
		}

		// Remove server identification
		c.header("Server", "");
		c.header("X-Powered-By", "");
	};
}

/**
 * Rate limit headers
 * Add these to responses to inform clients about rate limits
 */
export function addRateLimitHeaders(
	c: Context,
	limit: number,
	remaining: number,
	reset: number,
): void {
	c.header("X-RateLimit-Limit", limit.toString());
	c.header("X-RateLimit-Remaining", remaining.toString());
	c.header("X-RateLimit-Reset", reset.toString());
}
