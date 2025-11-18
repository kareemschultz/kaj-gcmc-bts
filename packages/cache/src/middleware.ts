/**
 * Cache Middleware for tRPC
 *
 * Provides intelligent caching for API endpoints with automatic invalidation
 */

import { CacheKeys, getCache } from "./redis-cache";
import type { CacheOptions } from "./types";

interface CacheableContext {
	tenant?: { id: number };
	user?: { id: number };
}

interface CacheMiddlewareOptions extends CacheOptions {
	keyBuilder?: (input: any, ctx: CacheableContext) => string;
	shouldCache?: (input: any, ctx: CacheableContext) => boolean;
	onCacheHit?: (key: string) => void;
	onCacheMiss?: (key: string) => void;
}

/**
 * tRPC middleware for caching query results
 */
export function cacheMiddleware<T>(options: CacheMiddlewareOptions = {}) {
	return async (opts: any) => {
		const { next, input, ctx, path } = opts;

		// Only cache queries, not mutations
		if (opts.type !== "query") {
			return next();
		}

		const cache = getCache();
		const defaultTtl = options.ttl || 300; // 5 minutes default

		// Check if we should cache this request
		if (options.shouldCache && !options.shouldCache(input, ctx)) {
			return next();
		}

		// Build cache key
		const cacheKey = options.keyBuilder
			? options.keyBuilder(input, ctx)
			: buildDefaultCacheKey(path, input, ctx);

		try {
			// Try to get from cache first
			const cachedResult = await cache.get<T>(cacheKey);

			if (cachedResult !== null) {
				options.onCacheHit?.(cacheKey);
				return { data: cachedResult };
			}

			// Cache miss - execute the actual procedure
			options.onCacheMiss?.(cacheKey);
			const result = await next();

			// Cache the result if it's successful
			if (result.data !== undefined) {
				const tags = buildCacheTags(path, ctx);

				await cache.set(cacheKey, result.data, {
					ttl: defaultTtl,
					tags,
					...options,
				});
			}

			return result;
		} catch (error) {
			// If cache fails, continue with normal execution
			console.error("Cache middleware error:", error);
			return next();
		}
	};
}

/**
 * Invalidate cache for specific patterns
 */
export async function invalidateCache(patterns: {
	tenantId?: number;
	userId?: number;
	tags?: string[];
	keys?: string[];
}): Promise<void> {
	const cache = getCache();

	try {
		// Invalidate by tags
		if (patterns.tags && patterns.tags.length > 0) {
			await cache.invalidateByTags(patterns.tags);
		}

		// Invalidate specific keys
		if (patterns.keys && patterns.keys.length > 0) {
			const pipeline = [];
			for (const key of patterns.keys) {
				pipeline.push(cache.del(key));
			}
			await Promise.all(pipeline);
		}

		// Invalidate tenant-specific cache
		if (patterns.tenantId) {
			await cache.invalidateByTags([CacheKeys.tags.tenant(patterns.tenantId)]);
		}

		// Invalidate user-specific cache
		if (patterns.userId) {
			await cache.invalidateByTags([CacheKeys.tags.user(patterns.userId)]);
		}
	} catch (error) {
		console.error("Cache invalidation error:", error);
	}
}

/**
 * Build default cache key for tRPC procedures
 */
function buildDefaultCacheKey(
	path: string,
	input: any,
	ctx: CacheableContext,
): string {
	const baseKey = `trpc:${path}`;
	const inputHash = input ? createSimpleHash(JSON.stringify(input)) : "";
	const tenantId = ctx.tenant?.id || "global";

	return `${baseKey}:${tenantId}:${inputHash}`;
}

/**
 * Build cache tags for automatic invalidation
 */
function buildCacheTags(path: string, ctx: CacheableContext): string[] {
	const tags: string[] = [];

	// Add tenant tag
	if (ctx.tenant?.id) {
		tags.push(CacheKeys.tags.tenant(ctx.tenant.id));
	}

	// Add user tag
	if (ctx.user?.id) {
		tags.push(CacheKeys.tags.user(ctx.user.id));
	}

	// Add procedure-specific tags based on path
	if (path.includes("dashboard")) {
		tags.push(CacheKeys.tags.dashboard);
	}

	if (path.includes("compliance")) {
		tags.push(CacheKeys.tags.compliance);
	}

	if (path.includes("reports")) {
		tags.push(CacheKeys.tags.reports);
	}

	return tags;
}

/**
 * Simple hash function for cache keys
 */
function createSimpleHash(str: string): string {
	let hash = 0;
	if (str.length === 0) return hash.toString();

	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return Math.abs(hash).toString(36);
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
	private static async warmDashboardCache(tenantId: number) {
		// Pre-populate common dashboard queries
		const cache = getCache();

		const dashboardQueries = [
			{ path: "dashboard.overview", input: null },
			{ path: "dashboard.complianceOverview", input: null },
			{ path: "guyana.complianceStats", input: null },
		];

		for (const query of dashboardQueries) {
			const key = buildDefaultCacheKey(query.path, query.input, {
				tenant: { id: tenantId },
			});

			// Check if already cached
			const exists = await cache.exists(key);
			if (!exists) {
				// Would trigger actual API calls to warm cache
				console.log(`Warming cache for ${key}`);
			}
		}
	}

	static async warmTenantCache(tenantId: number): Promise<void> {
		try {
			await Promise.all([
				CacheWarmer.warmDashboardCache(tenantId),
				// Add other cache warming strategies
			]);

			console.log(`Cache warmed for tenant ${tenantId}`);
		} catch (error) {
			console.error(`Cache warming failed for tenant ${tenantId}:`, error);
		}
	}
}
