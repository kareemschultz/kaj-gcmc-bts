/**
 * GCMC-KAJ Cache Package
 *
 * High-performance caching and performance monitoring for the platform
 */

// Middleware
export { CacheWarmer, cacheMiddleware, invalidateCache } from "./middleware.js";

// Performance Monitoring
export {
	PerformanceMonitor,
	performanceMiddleware,
	QueryOptimizer,
} from "./performance.js";
// Redis Cache Service
export { CacheKeys, createCache, getCache, RedisCache } from "./redis-cache.js";

// Types
export type {
	CacheConfig,
	CacheOptions,
	CacheStats,
	PerformanceMetrics,
} from "./types.js";
