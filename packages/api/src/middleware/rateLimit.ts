/**
 * Rate Limiting Middleware
 *
 * Protects against abuse and DoS attacks by limiting request rates
 * per user and per operation type
 *
 * IMPORTANT: This uses in-memory storage for simplicity.
 * For production with multiple servers, use Redis-backed storage.
 */

import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
}

/**
 * Rate limit presets
 */
export const RATE_LIMITS = {
	// Normal operations: 100 requests per minute
	NORMAL: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 100,
	},
	// Expensive operations (reports, bulk operations): 10 requests per minute
	EXPENSIVE: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 10,
	},
	// File uploads: 20 requests per minute
	UPLOAD: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 20,
	},
	// Authentication: 5 requests per minute
	AUTH: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 5,
	},
} as const;

/**
 * Rate limit entry
 */
interface RateLimitEntry {
	count: number;
	resetTime: number;
}

/**
 * In-memory rate limit store
 * Key format: "{userId}:{operation}"
 *
 * NOTE: For production, replace with Redis:
 * - Use ioredis or node-redis
 * - Set TTL on keys automatically
 * - Share state across multiple server instances
 */
class RateLimitStore {
	private store = new Map<string, RateLimitEntry>();
	private cleanupInterval: NodeJS.Timeout;

	constructor() {
		// Clean up expired entries every minute
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, 60 * 1000);
	}

	/**
	 * Check if user has exceeded rate limit
	 */
	check(key: string, config: RateLimitConfig): boolean {
		const now = Date.now();
		const entry = this.store.get(key);

		// No entry or expired - allow and create new entry
		if (!entry || now >= entry.resetTime) {
			this.store.set(key, {
				count: 1,
				resetTime: now + config.windowMs,
			});
			return true;
		}

		// Entry exists and not expired - check count
		if (entry.count < config.maxRequests) {
			entry.count++;
			return true;
		}

		// Rate limit exceeded
		return false;
	}

	/**
	 * Get remaining requests for a key
	 */
	getRemaining(
		key: string,
		config: RateLimitConfig,
	): {
		remaining: number;
		resetTime: number;
	} {
		const entry = this.store.get(key);
		const now = Date.now();

		if (!entry || now >= entry.resetTime) {
			return {
				remaining: config.maxRequests,
				resetTime: now + config.windowMs,
			};
		}

		return {
			remaining: Math.max(0, config.maxRequests - entry.count),
			resetTime: entry.resetTime,
		};
	}

	/**
	 * Clean up expired entries
	 */
	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.store.entries()) {
			if (now >= entry.resetTime) {
				this.store.delete(key);
			}
		}
	}

	/**
	 * Clear all entries (for testing)
	 */
	clear(): void {
		this.store.clear();
	}

	/**
	 * Cleanup on shutdown
	 */
	destroy(): void {
		clearInterval(this.cleanupInterval);
		this.store.clear();
	}
}

// Global rate limit store instance
const rateLimitStore = new RateLimitStore();

/**
 * Create a rate limiting middleware for tRPC
 */
export function createRateLimitMiddleware(
	operation: string,
	config: RateLimitConfig,
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

		const key = `${ctx.user.id}:${operation}`;
		const allowed = rateLimitStore.check(key, config);

		if (!allowed) {
			const { resetTime } = rateLimitStore.getRemaining(key, config);
			const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000);

			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
			});
		}

		return next();
	};
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
	normal: (operation: string) =>
		createRateLimitMiddleware(operation, RATE_LIMITS.NORMAL),
	expensive: (operation: string) =>
		createRateLimitMiddleware(operation, RATE_LIMITS.EXPENSIVE),
	upload: (operation: string) =>
		createRateLimitMiddleware(operation, RATE_LIMITS.UPLOAD),
	auth: (operation: string) =>
		createRateLimitMiddleware(operation, RATE_LIMITS.AUTH),
};

/**
 * Export store for testing
 */
export { rateLimitStore };
