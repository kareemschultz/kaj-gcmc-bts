/**
 * Rate Limiting Utilities
 */

import { RateLimiterMemory } from "rate-limiter-flexible";

export const defaultRateLimiter = new RateLimiterMemory({
	keyGenerator: (req: any) => req.ip,
	points: 100, // Number of requests
	duration: 60, // Per 60 seconds
});

export const strictRateLimiter = new RateLimiterMemory({
	keyGenerator: (req: any) => req.ip,
	points: 10,
	duration: 60,
});

export const loginRateLimiter = new RateLimiterMemory({
	keyGenerator: (req: any) => req.ip,
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
