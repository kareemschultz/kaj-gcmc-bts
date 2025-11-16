/**
 * Rate Limiting Middleware for Critical API Endpoints
 *
 * Implements rate limiting using Upstash Redis with specific limits for:
 * - Authentication operations (sign in, sign up)
 * - Report generation
 * - Messaging
 */

import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Redis client initialization
 * Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment
 * Skips rate limiting in development if Redis is not configured
 */
const redis =
	process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
		? new Redis({
				url: process.env.UPSTASH_REDIS_REST_URL,
				token: process.env.UPSTASH_REDIS_REST_TOKEN,
			})
		: null;

/**
 * Auth Rate Limiter
 * 5 requests per 15 minutes
 * Applied to: sign in, sign up endpoints
 */
export const authRateLimiter = redis
	? new Ratelimit({
			redis: redis,
			limiter: Ratelimit.slidingWindow(5, "15 m"),
			analytics: true,
			prefix: "@gcmc/auth",
		})
	: null;

/**
 * Report Generation Rate Limiter
 * 10 requests per hour
 * Applied to: all report generation endpoints
 */
export const reportRateLimiter = redis
	? new Ratelimit({
			redis: redis,
			limiter: Ratelimit.slidingWindow(10, "60 m"),
			analytics: true,
			prefix: "@gcmc/reports",
		})
	: null;

/**
 * Message Rate Limiter
 * 20 requests per hour
 * Applied to: portal sendMessage endpoint
 */
export const messageRateLimiter = redis
	? new Ratelimit({
			redis: redis,
			limiter: Ratelimit.slidingWindow(20, "60 m"),
			analytics: true,
			prefix: "@gcmc/messages",
		})
	: null;

/**
 * Check rate limit helper function
 *
 * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP address)
 * @param limiter - The rate limiter to use
 * @param operation - Name of the operation for error messages
 * @throws TRPCError with code "TOO_MANY_REQUESTS" if rate limit exceeded
 */
export async function checkRateLimit(
	identifier: string,
	limiter: Ratelimit | null,
	operation: string,
): Promise<void> {
	// Skip rate limiting if Redis is not configured (e.g., in development)
	if (!limiter) {
		if (process.env.NODE_ENV === "development") {
			console.log(
				`⚠️  Rate limiting disabled for ${operation} (Redis not configured)`,
			);
		}
		return;
	}

	try {
		const { success, limit, remaining, reset } =
			await limiter.limit(identifier);

		if (!success) {
			const resetDate = new Date(reset);
			const resetSeconds = Math.ceil((reset - Date.now()) / 1000);
			const resetMinutes = Math.ceil(resetSeconds / 60);

			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: `Rate limit exceeded for ${operation}. You have made ${limit} requests. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? "s" : ""} (${resetDate.toLocaleTimeString()}).`,
				cause: {
					limit,
					remaining,
					reset,
					resetDate: resetDate.toISOString(),
					retryAfter: resetSeconds,
				},
			});
		}

		// Log rate limit info in development
		if (process.env.NODE_ENV === "development") {
			console.log(
				`✅ Rate limit check passed for ${operation}: ${remaining}/${limit} remaining`,
			);
		}
	} catch (error) {
		// If it's already a TRPCError, rethrow it
		if (error instanceof TRPCError) {
			throw error;
		}

		// If Redis is down or there's a connection error, log it and allow the request
		// This prevents Redis issues from bringing down the entire API
		console.error(
			`❌ Rate limiting error for ${operation} (allowing request):`,
			error,
		);
	}
}

/**
 * Create a rate limit middleware for tRPC procedures
 *
 * @param limiter - The rate limiter to use
 * @param operation - Name of the operation for error messages
 * @returns Middleware function that can be used with tRPC procedures
 */
export function createRateLimitMiddleware(
	limiter: Ratelimit | null,
	operation: string,
) {
	return async function rateLimitMiddleware(opts: {
		ctx: { user?: { id: string } };
		next: () => Promise<unknown>;
	}) {
		const { ctx, next } = opts;

		// Use user ID as identifier if available, otherwise skip
		// (unauthenticated requests should be handled separately or use IP-based limiting)
		if (ctx.user?.id) {
			await checkRateLimit(ctx.user.id, limiter, operation);
		}

		return next();
	};
}

/**
 * Export Redis client for other uses
 */
export { redis };
