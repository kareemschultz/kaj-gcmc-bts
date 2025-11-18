/**
 * Redis Cache Service
 *
 * High-performance caching layer for the GCMC-KAJ platform
 * - Dashboard data caching
 * - API response caching
 * - Session management
 * - Rate limiting support
 */

import Redis from "ioredis";

interface CacheConfig {
	host: string;
	port: number;
	password?: string;
	db?: number;
	keyPrefix?: string;
	retryDelayOnFailover?: number;
	maxRetriesPerRequest?: number;
}

interface CacheOptions {
	ttl?: number; // Time to live in seconds
	compress?: boolean;
	tags?: string[]; // For cache invalidation
}

export class RedisCache {
	private client: Redis;
	private isConnected = false;

	constructor(config: CacheConfig) {
		this.client = new Redis({
			host: config.host,
			port: config.port,
			password: config.password,
			db: config.db || 0,
			keyPrefix: config.keyPrefix || "gcmc:",
			retryDelayOnFailover: config.retryDelayOnFailover || 100,
			maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
			lazyConnect: true,
		});

		this.setupEventHandlers();
	}

	private setupEventHandlers() {
		this.client.on("connect", () => {
			this.isConnected = true;
			console.log("Redis cache connected");
		});

		this.client.on("error", (error) => {
			this.isConnected = false;
			console.error("Redis cache error:", error);
		});

		this.client.on("close", () => {
			this.isConnected = false;
			console.log("Redis cache connection closed");
		});
	}

	async connect(): Promise<void> {
		if (!this.isConnected) {
			await this.client.connect();
		}
	}

	async disconnect(): Promise<void> {
		if (this.isConnected) {
			await this.client.quit();
		}
	}

	/**
	 * Set a value in cache with optional TTL and compression
	 */
	async set<T>(
		key: string,
		value: T,
		options: CacheOptions = {},
	): Promise<boolean> {
		try {
			const serialized = JSON.stringify(value);
			const finalValue = options.compress
				? await this.compress(serialized)
				: serialized;

			const args = [key, finalValue];

			if (options.ttl) {
				args.push("EX", options.ttl.toString());
			}

			const result = await this.client.set(...args);

			// Store tags for cache invalidation
			if (options.tags && options.tags.length > 0) {
				await this.addTags(key, options.tags);
			}

			return result === "OK";
		} catch (error) {
			console.error(`Failed to set cache key ${key}:`, error);
			return false;
		}
	}

	/**
	 * Get a value from cache with automatic decompression
	 */
	async get<T>(key: string, compressed = false): Promise<T | null> {
		try {
			const value = await this.client.get(key);

			if (value === null) {
				return null;
			}

			const decompressed = compressed ? await this.decompress(value) : value;

			return JSON.parse(decompressed);
		} catch (error) {
			console.error(`Failed to get cache key ${key}:`, error);
			return null;
		}
	}

	/**
	 * Delete a single key
	 */
	async del(key: string): Promise<boolean> {
		try {
			const result = await this.client.del(key);

			// Clean up tags
			await this.removeTags(key);

			return result > 0;
		} catch (error) {
			console.error(`Failed to delete cache key ${key}:`, error);
			return false;
		}
	}

	/**
	 * Check if key exists
	 */
	async exists(key: string): Promise<boolean> {
		try {
			const result = await this.client.exists(key);
			return result === 1;
		} catch (error) {
			console.error(`Failed to check cache key ${key}:`, error);
			return false;
		}
	}

	/**
	 * Set expiration for existing key
	 */
	async expire(key: string, ttl: number): Promise<boolean> {
		try {
			const result = await this.client.expire(key, ttl);
			return result === 1;
		} catch (error) {
			console.error(`Failed to set expiration for key ${key}:`, error);
			return false;
		}
	}

	/**
	 * Get multiple keys at once
	 */
	async mget<T>(keys: string[]): Promise<(T | null)[]> {
		try {
			const values = await this.client.mget(...keys);

			return values.map((value) => {
				if (value === null) return null;
				try {
					return JSON.parse(value);
				} catch {
					return null;
				}
			});
		} catch (error) {
			console.error("Failed to get multiple cache keys:", error);
			return keys.map(() => null);
		}
	}

	/**
	 * Invalidate cache by tags
	 */
	async invalidateByTags(tags: string[]): Promise<number> {
		try {
			const keys = new Set<string>();

			for (const tag of tags) {
				const tagKeys = await this.client.smembers(`tag:${tag}`);
				tagKeys.forEach((key) => keys.add(key));
			}

			if (keys.size === 0) return 0;

			const keysArray = Array.from(keys);
			const pipeline = this.client.pipeline();

			// Delete all keys
			keysArray.forEach((key) => pipeline.del(key));

			// Clean up tag sets
			tags.forEach((tag) => pipeline.del(`tag:${tag}`));

			const _results = await pipeline.exec();
			return keysArray.length;
		} catch (error) {
			console.error("Failed to invalidate cache by tags:", error);
			return 0;
		}
	}

	/**
	 * Clear all cache (use with caution)
	 */
	async flush(): Promise<boolean> {
		try {
			await this.client.flushdb();
			return true;
		} catch (error) {
			console.error("Failed to flush cache:", error);
			return false;
		}
	}

	/**
	 * Get cache statistics
	 */
	async getStats(): Promise<{
		keyCount: number;
		memory: string;
		hits: number;
		misses: number;
		hitRate: number;
	}> {
		try {
			const info = await this.client.info("stats");
			const memory = await this.client.info("memory");
			const keyCount = await this.client.dbsize();

			const stats = this.parseRedisInfo(info);
			const memStats = this.parseRedisInfo(memory);

			const hits = Number.parseInt(stats.keyspace_hits || "0", 10);
			const misses = Number.parseInt(stats.keyspace_misses || "0", 10);
			const total = hits + misses;
			const hitRate = total > 0 ? (hits / total) * 100 : 0;

			return {
				keyCount,
				memory: memStats.used_memory_human || "Unknown",
				hits,
				misses,
				hitRate: Math.round(hitRate * 100) / 100,
			};
		} catch (error) {
			console.error("Failed to get cache stats:", error);
			return {
				keyCount: 0,
				memory: "0B",
				hits: 0,
				misses: 0,
				hitRate: 0,
			};
		}
	}

	// Private helper methods

	private async compress(data: string): Promise<string> {
		// Implement compression if needed (zlib, gzip, etc.)
		// For now, return as-is
		return data;
	}

	private async decompress(data: string): Promise<string> {
		// Implement decompression if needed
		// For now, return as-is
		return data;
	}

	private async addTags(key: string, tags: string[]): Promise<void> {
		const pipeline = this.client.pipeline();

		tags.forEach((tag) => {
			pipeline.sadd(`tag:${tag}`, key);
		});

		await pipeline.exec();
	}

	private async removeTags(key: string): Promise<void> {
		// This is a simplified approach - in production you might want
		// to maintain a reverse index of key -> tags
		const allTags = await this.client.keys("tag:*");

		if (allTags.length > 0) {
			const pipeline = this.client.pipeline();

			allTags.forEach((tag) => {
				pipeline.srem(tag, key);
			});

			await pipeline.exec();
		}
	}

	private parseRedisInfo(info: string): Record<string, string> {
		const result: Record<string, string> = {};

		info.split("\r\n").forEach((line) => {
			if (line.includes(":")) {
				const [key, value] = line.split(":");
				result[key] = value;
			}
		});

		return result;
	}
}

// Singleton instance for the application
let cacheInstance: RedisCache | null = null;

export function createCache(config: CacheConfig): RedisCache {
	if (!cacheInstance) {
		cacheInstance = new RedisCache(config);
	}
	return cacheInstance;
}

export function getCache(): RedisCache {
	if (!cacheInstance) {
		throw new Error("Cache not initialized. Call createCache() first.");
	}
	return cacheInstance;
}

// Cache key builders for consistent naming
export const CacheKeys = {
	// Dashboard
	dashboard: (tenantId: number) => `dashboard:${tenantId}`,
	complianceOverview: (tenantId: number) => `compliance:overview:${tenantId}`,

	// Guyana-specific
	guyanaStats: (tenantId: number) => `guyana:stats:${tenantId}`,
	grtStatus: (tenantId: number) => `guyana:grt:status:${tenantId}`,
	corporationTaxStatus: (tenantId: number) =>
		`guyana:corporation-tax:status:${tenantId}`,
	payeStatus: (tenantId: number) => `guyana:paye:status:${tenantId}`,
	withholdingTaxStatus: (tenantId: number) =>
		`guyana:withholding-tax:status:${tenantId}`,
	businessRegistrationStatus: (tenantId: number) =>
		`guyana:business-registration:status:${tenantId}`,
	taxCalendar: (tenantId: number) => `guyana:tax-calendar:${tenantId}`,
	complianceDeadlines: (tenantId: number) =>
		`guyana:compliance-deadlines:${tenantId}`,
	taxFilingStatus: (tenantId: number) => `guyana:tax-filing-status:${tenantId}`,
	filingStatus: (tenantId: number) => `guyana:filing-status:${tenantId}`,

	// General
	clientList: (tenantId: number) => `clients:list:${tenantId}`,
	userPermissions: (userId: number) => `user:permissions:${userId}`,
	recentReports: (tenantId: number) => `reports:recent:${tenantId}`,
	storageStats: (tenantId: number) => `storage:stats:${tenantId}`,

	// Client Analytics
	clientProfile: (tenantId: number, clientId: number) => `client:profile:${tenantId}:${clientId}`,
	clientCompliance: (tenantId: number, clientId: number) => `client:compliance:${tenantId}:${clientId}`,
	clientDocuments: (tenantId: number, clientId: number) => `client:documents:${tenantId}:${clientId}`,
	clientFilings: (tenantId: number, clientId: number) => `client:filings:${tenantId}:${clientId}`,
	clientServices: (tenantId: number, clientId: number) => `client:services:${tenantId}:${clientId}`,
	clientActivity: (tenantId: number, clientId: number) => `client:activity:${tenantId}:${clientId}`,

	// Tag-based cache groups for invalidation
	tags: {
		tenant: (tenantId: number) => `tenant:${tenantId}`,
		user: (userId: number) => `user:${userId}`,
		compliance: "compliance",
		reports: "reports",
		dashboard: "dashboard",
		filings: "filings",
		clients: "clients",
		documents: "documents",
		services: "services",
		activity: "activity",
		grt: "grt",
		corporationTax: "corporation-tax",
		paye: "paye",
		withholdingTax: "withholding-tax",
		businessRegistration: "business-registration",
	},
};
