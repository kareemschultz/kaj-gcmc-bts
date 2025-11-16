/**
 * Authentication Rate Limiting Middleware for Hono
 *
 * Applies rate limiting to Better-Auth endpoints (sign in, sign up)
 * Uses Upstash Redis for distributed rate limiting
 */

import { authRateLimiter } from "@GCMC-KAJ/api/middleware/rate-limit";
import type { Context, Next } from "hono";

/**
 * Extract identifier from request for rate limiting
 * Uses IP address for unauthenticated requests (sign in/up)
 */
function getIdentifier(c: Context): string {
	// For auth endpoints, use IP address since user isn't authenticated yet
	const forwarded = c.req.header("x-forwarded-for");
	const ip = forwarded?.split(",")[0]?.trim() || c.req.header("x-real-ip");

	if (ip) {
		return `ip:${ip}`;
	}

	// Fallback to a generic identifier if IP can't be determined
	// This is better than failing the request
	return "unknown";
}

/**
 * Auth rate limiting middleware for Hono
 * Applies to /api/auth/* endpoints
 */
export async function authRateLimitMiddleware(c: Context, next: Next) {
	// Skip rate limiting if Redis is not configured (e.g., in development)
	if (!authRateLimiter) {
		if (process.env.NODE_ENV === "development") {
			console.log("⚠️  Auth rate limiting disabled (Redis not configured)");
		}
		return next();
	}

	const identifier = getIdentifier(c);

	try {
		const { success, limit, remaining, reset } =
			await authRateLimiter.limit(identifier);

		if (!success) {
			const resetDate = new Date(reset);
			const resetSeconds = Math.ceil((reset - Date.now()) / 1000);
			const resetMinutes = Math.ceil(resetSeconds / 60);

			return c.json(
				{
					error: "TOO_MANY_REQUESTS",
					message: `Rate limit exceeded for authentication. You have made ${limit} requests. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? "s" : ""} (${resetDate.toLocaleTimeString()}).`,
					limit,
					remaining,
					reset: resetDate.toISOString(),
					retryAfter: resetSeconds,
				},
				429,
				{
					"Retry-After": resetSeconds.toString(),
					"X-RateLimit-Limit": limit.toString(),
					"X-RateLimit-Remaining": remaining.toString(),
					"X-RateLimit-Reset": reset.toString(),
				},
			);
		}

		// Add rate limit headers to successful responses
		c.header("X-RateLimit-Limit", limit.toString());
		c.header("X-RateLimit-Remaining", remaining.toString());
		c.header("X-RateLimit-Reset", reset.toString());

		// Log rate limit info in development
		if (process.env.NODE_ENV === "development") {
			console.log(
				`✅ Auth rate limit check passed for ${identifier}: ${remaining}/${limit} remaining`,
			);
		}

		return next();
	} catch (error) {
		// If Redis is down or there's a connection error, log it and allow the request
		// This prevents Redis issues from bringing down authentication
		console.error("❌ Auth rate limiting error (allowing request):", error);
		return next();
	}
}
