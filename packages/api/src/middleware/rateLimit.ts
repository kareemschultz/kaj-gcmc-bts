/**
 * Rate Limiting Middleware
 *
 * Production-ready rate limiting using Redis for distributed rate limiting
 * across multiple server instances.
 *
 * This implementation uses @upstash/ratelimit with Redis backend to ensure
 * consistent rate limiting across all API server instances.
 */

import { TRPCError } from "@trpc/server";
import type { Context } from "../context";
import type { RateLimiterType } from "../lib/rate-limiter";
import {
	authRateLimiter,
	expensiveRateLimiter,
	normalRateLimiter,
	uploadRateLimiter,
} from "../lib/rate-limiter";

/**
 * Create a rate limiting middleware for tRPC using Redis
 */
export function createRateLimitMiddleware(
	operation: string,
	limiter: RateLimiterType,
) {
	return async ({
		ctx,
		next,
	}: {
		ctx: Context;
		next: () => Promise<unknown>;
	}) => {
		// Skip rate limiting for unauthenticated requests (they should fail auth first)
		if (!ctx.user?.id) {
			return next();
		}

		// Create unique identifier combining user ID and operation
		const identifier = `${ctx.user.id}:${operation}`;

		try {
			// Check rate limit
			const { success, limit, remaining, reset } =
				await limiter.limit(identifier);

			if (!success) {
				const resetSeconds = Math.ceil((reset - Date.now()) / 1000);

				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
					cause: {
						limit,
						remaining,
						reset,
						retryAfter: resetSeconds,
					},
				});
			}

			// Add rate limit info to context for potential response headers
			// This can be used by the response handler to add X-RateLimit-* headers
			if (ctx) {
				Object.assign(ctx, {
					rateLimit: {
						limit,
						remaining,
						reset,
					},
				});
			}

			return next();
		} catch (error) {
			// If it's already a TRPCError, rethrow it
			if (error instanceof TRPCError) {
				throw error;
			}

			// If Redis is down or there's a connection error, log it and allow the request
			// This prevents Redis issues from bringing down the entire API
			console.error("Rate limiting error (allowing request):", error);
			return next();
		}
	};
}

/**
 * Pre-configured rate limiters for different operation types
 */
export const rateLimiters = {
	/**
	 * Normal operations: 100 requests per minute
	 */
	normal: (operation: string) =>
		createRateLimitMiddleware(operation, normalRateLimiter),

	/**
	 * Expensive operations (reports, bulk operations): 10 requests per minute
	 */
	expensive: (operation: string) =>
		createRateLimitMiddleware(operation, expensiveRateLimiter),

	/**
	 * File upload operations: 20 requests per minute
	 */
	upload: (operation: string) =>
		createRateLimitMiddleware(operation, uploadRateLimiter),

	/**
	 * Authentication operations: 5 requests per minute
	 */
	auth: (operation: string) =>
		createRateLimitMiddleware(operation, authRateLimiter),
};
