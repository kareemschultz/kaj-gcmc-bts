/**
 * Cache Type Definitions
 */

export interface CacheConfig {
	host: string;
	port: number;
	password?: string;
	db?: number;
	keyPrefix?: string;
	retryDelayOnFailover?: number;
	maxRetriesPerRequest?: number;
}

export interface CacheOptions {
	ttl?: number; // Time to live in seconds
	compress?: boolean;
	tags?: string[]; // For cache invalidation
}

export interface CacheStats {
	keyCount: number;
	memory: string;
	hits: number;
	misses: number;
	hitRate: number;
}

export interface PerformanceMetrics {
	endpoint: string;
	method: string;
	responseTime: number;
	timestamp: Date;
	statusCode: number;
	tenantId?: number;
	userId?: number;
	errorMessage?: string;
}
