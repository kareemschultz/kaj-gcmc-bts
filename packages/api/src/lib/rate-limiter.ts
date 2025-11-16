/**
 * Redis-backed Rate Limiting
 *
 * Production-ready rate limiting using Redis for distributed rate limiting
 * across multiple server instances.
 *
 * This replaces the in-memory rate limiting implementation with a Redis-backed
 * solution that works correctly in multi-server deployments.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Redis client configuration
 * Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment
 * Falls back to local Redis URL for development if Upstash credentials not available
 */
const redis =
	process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
		? new Redis({
				url: process.env.UPSTASH_REDIS_REST_URL,
				token: process.env.UPSTASH_REDIS_REST_TOKEN,
			})
		: Redis.fromEnv();

/**
 * Normal operations rate limiter
 * 100 requests per minute (60 seconds)
 */
export const normalRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(100, "60 s"),
	analytics: true,
	prefix: "gcmc:ratelimit:normal",
});

/**
 * Expensive operations rate limiter (reports, bulk operations)
 * 10 requests per minute (60 seconds)
 */
export const expensiveRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(10, "60 s"),
	analytics: true,
	prefix: "gcmc:ratelimit:expensive",
});

/**
 * File upload operations rate limiter
 * 20 requests per minute (60 seconds)
 */
export const uploadRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(20, "60 s"),
	analytics: true,
	prefix: "gcmc:ratelimit:upload",
});

/**
 * Authentication operations rate limiter
 * 5 requests per minute (60 seconds)
 */
export const authRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(5, "60 s"),
	analytics: true,
	prefix: "gcmc:ratelimit:auth",
});

/**
 * Rate limiter type for type safety
 */
export type RateLimiterType = typeof normalRateLimiter;

/**
 * Export Redis client for other uses (e.g., caching, sessions)
 */
export { redis };

/**
 * Cleanup function for graceful shutdown
 * Note: @upstash/redis uses HTTP requests, so no persistent connection to close
 */
export async function closeRedis(): Promise<void> {
	// @upstash/redis uses HTTP/REST, no persistent connection to close
	console.log("Redis cleanup completed (using Upstash REST API)");
}
