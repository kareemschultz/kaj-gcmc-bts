/**
 * Multi-Level Caching Service
 *
 * Implements L1 (in-memory), L2 (Redis), and cache invalidation strategies
 */

import { logger } from "../logging/Logger";
import { metrics } from "../monitoring/MetricsCollector";

export interface CacheEntry<T = any> {
	value: T;
	expiresAt: number;
	tags: string[];
}

export interface CacheOptions {
	ttl?: number; // Time to live in seconds
	tags?: string[]; // For cache invalidation
	compress?: boolean;
	namespace?: string;
}

export interface CacheStats {
	hits: number;
	misses: number;
	sets: number;
	deletes: number;
	size: number;
}

export interface CacheService {
	get<T>(key: string, options?: CacheOptions): Promise<T | null>;
	set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
	delete(key: string, options?: CacheOptions): Promise<void>;
	invalidateByTags(tags: string[], options?: CacheOptions): Promise<void>;
	clear(options?: CacheOptions): Promise<void>;
	getStats(): Promise<CacheStats>;
}

export class MultiLevelCacheService implements CacheService {
	private l1Cache: Map<string, CacheEntry> = new Map();
	private l1MaxSize = 1000;
	private l1Stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

	// Metrics
	private cacheHitsCounter = metrics.createCounter(
		"cache_hits_total",
		"Total cache hits",
	);
	private cacheMissesCounter = metrics.createCounter(
		"cache_misses_total",
		"Total cache misses",
	);
	private cacheSetsCounter = metrics.createCounter(
		"cache_sets_total",
		"Total cache sets",
	);
	private cacheDeletesCounter = metrics.createCounter(
		"cache_deletes_total",
		"Total cache deletes",
	);
	private cacheOperationTimer = metrics.createTimer(
		"cache_operation",
		"Cache operation duration",
	);

	constructor(
		private redisClient: any, // Redis client
		private defaultTtl = 3600, // 1 hour default TTL
	) {
		// Cleanup expired L1 entries periodically
		setInterval(() => this.cleanupL1Cache(), 60000); // Every minute
	}

	async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
		const namespace = options.namespace || "default";
		const namespacedKey = `${namespace}:${key}`;

		return this.cacheOperationTimer.timeAsync(
			async () => {
				// Try L1 cache first
				const l1Entry = this.l1Cache.get(namespacedKey);
				if (l1Entry && l1Entry.expiresAt > Date.now()) {
					this.l1Stats.hits++;
					this.cacheHitsCounter.increment({ level: "l1", namespace });
					logger.debug("Cache hit (L1)", { key: namespacedKey });
					return l1Entry.value;
				}

				// Remove expired L1 entry
				if (l1Entry) {
					this.l1Cache.delete(namespacedKey);
				}

				// Try L2 (Redis) cache
				try {
					const redisValue = await this.redisClient.get(namespacedKey);
					if (redisValue !== null) {
						const entry: CacheEntry<T> = JSON.parse(redisValue);

						// Check if expired
						if (entry.expiresAt > Date.now()) {
							// Promote to L1 cache
							this.setL1Cache(namespacedKey, entry);

							this.cacheHitsCounter.increment({ level: "l2", namespace });
							logger.debug("Cache hit (L2)", { key: namespacedKey });
							return entry.value;
						}
						// Remove expired entry from Redis
						await this.redisClient.del(namespacedKey);
					}
				} catch (error) {
					logger.error("Redis cache get error", error, { key: namespacedKey });
				}

				this.l1Stats.misses++;
				this.cacheMissesCounter.increment({ namespace });
				logger.debug("Cache miss", { key: namespacedKey });
				return null;
			},
			{ operation: "get", namespace },
		);
	}

	async set<T>(
		key: string,
		value: T,
		options: CacheOptions = {},
	): Promise<void> {
		const namespace = options.namespace || "default";
		const namespacedKey = `${namespace}:${key}`;
		const ttl = options.ttl || this.defaultTtl;
		const expiresAt = Date.now() + ttl * 1000;
		const tags = options.tags || [];

		const entry: CacheEntry<T> = {
			value,
			expiresAt,
			tags,
		};

		return this.cacheOperationTimer.timeAsync(
			async () => {
				// Set in L1 cache
				this.setL1Cache(namespacedKey, entry);

				// Set in L2 (Redis) cache
				try {
					const serializedEntry = JSON.stringify(entry);
					await this.redisClient.setex(namespacedKey, ttl, serializedEntry);

					// Store tags for invalidation
					if (tags.length > 0) {
						for (const tag of tags) {
							const tagKey = `tag:${namespace}:${tag}`;
							await this.redisClient.sadd(tagKey, namespacedKey);
							await this.redisClient.expire(tagKey, ttl);
						}
					}
				} catch (error) {
					logger.error("Redis cache set error", error, { key: namespacedKey });
				}

				this.l1Stats.sets++;
				this.cacheSetsCounter.increment({ namespace });
				logger.debug("Cache set", { key: namespacedKey, ttl, tags });
			},
			{ operation: "set", namespace },
		);
	}

	async delete(key: string, options: CacheOptions = {}): Promise<void> {
		const namespace = options.namespace || "default";
		const namespacedKey = `${namespace}:${key}`;

		return this.cacheOperationTimer.timeAsync(
			async () => {
				// Remove from L1
				this.l1Cache.delete(namespacedKey);

				// Remove from L2
				try {
					await this.redisClient.del(namespacedKey);
				} catch (error) {
					logger.error("Redis cache delete error", error, {
						key: namespacedKey,
					});
				}

				this.l1Stats.deletes++;
				this.cacheDeletesCounter.increment({ namespace });
				logger.debug("Cache delete", { key: namespacedKey });
			},
			{ operation: "delete", namespace },
		);
	}

	async invalidateByTags(
		tags: string[],
		options: CacheOptions = {},
	): Promise<void> {
		const namespace = options.namespace || "default";

		return this.cacheOperationTimer.timeAsync(
			async () => {
				const keysToDelete = new Set<string>();

				for (const tag of tags) {
					const tagKey = `tag:${namespace}:${tag}`;

					try {
						const keys = await this.redisClient.smembers(tagKey);
						keys.forEach((key: string) => keysToDelete.add(key));
						await this.redisClient.del(tagKey);
					} catch (error) {
						logger.error("Redis tag invalidation error", error, {
							tag: tagKey,
						});
					}
				}

				// Remove from both caches
				for (const key of keysToDelete) {
					this.l1Cache.delete(key);
					try {
						await this.redisClient.del(key);
					} catch (error) {
						logger.error("Redis key deletion error", error, { key });
					}
				}

				logger.info("Cache invalidation by tags", {
					tags,
					namespace,
					keysInvalidated: keysToDelete.size,
				});
			},
			{ operation: "invalidate_tags", namespace },
		);
	}

	async clear(options: CacheOptions = {}): Promise<void> {
		const namespace = options.namespace || "default";

		return this.cacheOperationTimer.timeAsync(
			async () => {
				// Clear L1 cache for namespace
				for (const key of this.l1Cache.keys()) {
					if (key.startsWith(`${namespace}:`)) {
						this.l1Cache.delete(key);
					}
				}

				// Clear L2 cache for namespace
				try {
					const pattern = `${namespace}:*`;
					const keys = await this.redisClient.keys(pattern);
					if (keys.length > 0) {
						await this.redisClient.del(keys);
					}

					// Clear tag keys
					const tagPattern = `tag:${namespace}:*`;
					const tagKeys = await this.redisClient.keys(tagPattern);
					if (tagKeys.length > 0) {
						await this.redisClient.del(tagKeys);
					}
				} catch (error) {
					logger.error("Redis cache clear error", error, { namespace });
				}

				logger.info("Cache cleared", { namespace });
			},
			{ operation: "clear", namespace },
		);
	}

	async getStats(): Promise<CacheStats> {
		return {
			hits: this.l1Stats.hits,
			misses: this.l1Stats.misses,
			sets: this.l1Stats.sets,
			deletes: this.l1Stats.deletes,
			size: this.l1Cache.size,
		};
	}

	// Cache warming utilities
	async warmCache<T>(
		key: string,
		fetcher: () => Promise<T>,
		options: CacheOptions = {},
	): Promise<T> {
		const cached = await this.get<T>(key, options);
		if (cached !== null) {
			return cached;
		}

		const value = await fetcher();
		await this.set(key, value, options);
		return value;
	}

	// Cache-aside pattern helper
	async getOrSet<T>(
		key: string,
		fetcher: () => Promise<T>,
		options: CacheOptions = {},
	): Promise<T> {
		return this.warmCache(key, fetcher, options);
	}

	private setL1Cache<T>(key: string, entry: CacheEntry<T>): void {
		// Implement LRU eviction if at max size
		if (this.l1Cache.size >= this.l1MaxSize) {
			const firstKey = this.l1Cache.keys().next().value;
			if (firstKey) {
				this.l1Cache.delete(firstKey);
			}
		}

		this.l1Cache.set(key, entry);
	}

	private cleanupL1Cache(): void {
		const now = Date.now();
		let cleanedCount = 0;

		for (const [key, entry] of this.l1Cache) {
			if (entry.expiresAt <= now) {
				this.l1Cache.delete(key);
				cleanedCount++;
			}
		}

		if (cleanedCount > 0) {
			logger.debug("L1 cache cleanup", {
				cleanedCount,
				remainingSize: this.l1Cache.size,
			});
		}
	}
}

// Cache key builders
export class CacheKeyBuilder {
	static client(tenantId: number, clientId: number): string {
		return `client:${tenantId}:${clientId}`;
	}

	static clientList(tenantId: number, criteria: string): string {
		return `clients:${tenantId}:${criteria}`;
	}

	static complianceScore(tenantId: number, clientId: number): string {
		return `compliance:${tenantId}:${clientId}`;
	}

	static filingsByClient(tenantId: number, clientId: number): string {
		return `filings:${tenantId}:client:${clientId}`;
	}

	static documentsByClient(tenantId: number, clientId: number): string {
		return `documents:${tenantId}:client:${clientId}`;
	}
}

// Cache tags for invalidation
export class CacheTags {
	static client(tenantId: number, clientId?: number): string {
		return clientId ? `client:${tenantId}:${clientId}` : `clients:${tenantId}`;
	}

	static tenant(tenantId: number): string {
		return `tenant:${tenantId}`;
	}

	static compliance(tenantId: number): string {
		return `compliance:${tenantId}`;
	}

	static filings(tenantId: number): string {
		return `filings:${tenantId}`;
	}

	static documents(tenantId: number): string {
		return `documents:${tenantId}`;
	}
}
