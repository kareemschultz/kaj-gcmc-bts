/**
 * Rate Limiting Utilities
 */

import { RateLimiterMemory } from "rate-limiter-flexible";

/**
 * Request interface with ip property for rate limiting
 */
interface RateLimitRequest {
	ip: string;
	[key: string]: unknown;
}

export const defaultRateLimiter = new RateLimiterMemory({
	points: 100, // Number of requests
	duration: 60, // Per 60 seconds
});

export const strictRateLimiter = new RateLimiterMemory({
	points: 10,
	duration: 60,
});

export const loginRateLimiter = new RateLimiterMemory({
	points: 5, // Number of login attempts
	duration: 900, // Per 15 minutes
});

export async function checkRateLimit(
	limiter: RateLimiterMemory,
	key: string,
): Promise<boolean> {
	try {
		await limiter.consume(key);
		return true;
	} catch {
		return false;
	}
}

export function getRateLimitHeaders(limiter: RateLimiterMemory, key: string) {
	return limiter.get(key).then((resRateLimiter) => {
		if (resRateLimiter) {
			return {
				"X-RateLimit-Limit": limiter.points,
				"X-RateLimit-Remaining": resRateLimiter.remainingPoints || 0,
				"X-RateLimit-Reset": new Date(Date.now() + resRateLimiter.msBeforeNext),
			};
		}
		return {};
	});
}
