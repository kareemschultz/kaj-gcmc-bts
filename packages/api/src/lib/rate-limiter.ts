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
import Redis from "ioredis";

/**
 * Redis client configuration
 * Uses REDIS_URL from environment or defaults to localhost for development
 */
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: 3,
	enableReadyCheck: true,
	lazyConnect: false,
});

/**
 * Handle Redis connection errors
 */
redis.on("error", (error) => {
	console.error("Redis connection error:", error);
});

redis.on("connect", () => {
	console.log("Redis connected successfully");
});

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
 */
export async function closeRedis(): Promise<void> {
	try {
		await redis.quit();
		console.log("Redis connection closed");
	} catch (error) {
		console.error("Error closing Redis connection:", error);
	}
}
