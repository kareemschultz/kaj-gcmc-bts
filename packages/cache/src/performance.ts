/**
 * Performance Monitoring and Optimization
 *
 * Tracks API performance, identifies bottlenecks, and provides optimization insights
 */

import { getCache } from "./redis-cache";
import type { PerformanceMetrics } from "./types";

export class PerformanceMonitor {
	private static metricsBuffer: PerformanceMetrics[] = [];
	private static flushInterval: NodeJS.Timeout | null = null;

	/**
	 * Record performance metric
	 */
	static record(metrics: PerformanceMetrics): void {
		PerformanceMonitor.metricsBuffer.push(metrics);

		// Auto-flush buffer when it gets too large
		if (PerformanceMonitor.metricsBuffer.length >= 100) {
			PerformanceMonitor.flush();
		}

		// Start flush interval if not already running
		if (!PerformanceMonitor.flushInterval) {
			PerformanceMonitor.flushInterval = setInterval(
				() => PerformanceMonitor.flush(),
				60000,
			); // Flush every minute
		}
	}

	/**
	 * Flush metrics buffer to cache/storage
	 */
	static async flush(): Promise<void> {
		if (PerformanceMonitor.metricsBuffer.length === 0) return;

		const cache = getCache();
		const metrics = [...PerformanceMonitor.metricsBuffer];
		PerformanceMonitor.metricsBuffer = [];

		try {
			// Store aggregated metrics in cache
			const aggregated = PerformanceMonitor.aggregateMetrics(metrics);

			await Promise.all([
				// Store current aggregations
				cache.set("performance:current", aggregated, { ttl: 3600 }),

				// Store individual metrics for detailed analysis (shorter TTL)
				cache.set(
					`performance:raw:${Date.now()}`,
					metrics,
					{ ttl: 1800 }, // 30 minutes
				),
			]);

			// Update performance insights
			await PerformanceMonitor.updatePerformanceInsights(aggregated);
		} catch (error) {
			console.error("Failed to flush performance metrics:", error);
			// Put metrics back in buffer for retry
			PerformanceMonitor.metricsBuffer.unshift(...metrics);
		}
	}

	/**
	 * Get performance statistics
	 */
	static async getStats(timeframe: "current" | "hourly" | "daily" = "current") {
		const cache = getCache();

		try {
			const key = `performance:${timeframe}`;
			const stats = await cache.get(key);

			if (!stats) {
				return PerformanceMonitor.getDefaultStats();
			}

			return stats;
		} catch (error) {
			console.error("Failed to get performance stats:", error);
			return PerformanceMonitor.getDefaultStats();
		}
	}

	/**
	 * Get slow queries report
	 */
	static async getSlowQueries(_limit = 10) {
		const cache = getCache();

		try {
			const slowQueries = await cache.get("performance:slow_queries");
			return slowQueries || [];
		} catch (error) {
			console.error("Failed to get slow queries:", error);
			return [];
		}
	}

	/**
	 * Get performance insights and recommendations
	 */
	static async getInsights() {
		const cache = getCache();

		try {
			const insights = await cache.get("performance:insights");
			return (
				insights || {
					recommendations: [],
					alerts: [],
					trends: {},
				}
			);
		} catch (error) {
			console.error("Failed to get performance insights:", error);
			return {
				recommendations: [],
				alerts: [],
				trends: {},
			};
		}
	}

	// Private helper methods

	private static aggregateMetrics(metrics: PerformanceMetrics[]) {
		const aggregated = {
			totalRequests: metrics.length,
			averageResponseTime: 0,
			medianResponseTime: 0,
			p95ResponseTime: 0,
			p99ResponseTime: 0,
			errorRate: 0,
			requestsByEndpoint: {} as Record<string, number>,
			averageResponseTimeByEndpoint: {} as Record<string, number>,
			slowQueries: [] as PerformanceMetrics[],
		};

		if (metrics.length === 0) return aggregated;

		// Calculate response time statistics
		const responseTimes = metrics
			.map((m) => m.responseTime)
			.sort((a, b) => a - b);
		aggregated.averageResponseTime =
			responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
		aggregated.medianResponseTime =
			responseTimes[Math.floor(responseTimes.length / 2)];
		aggregated.p95ResponseTime =
			responseTimes[Math.floor(responseTimes.length * 0.95)];
		aggregated.p99ResponseTime =
			responseTimes[Math.floor(responseTimes.length * 0.99)];

		// Calculate error rate
		const errorCount = metrics.filter((m) => m.statusCode >= 400).length;
		aggregated.errorRate = (errorCount / metrics.length) * 100;

		// Aggregate by endpoint
		const endpointMetrics = new Map<string, PerformanceMetrics[]>();

		metrics.forEach((metric) => {
			const key = `${metric.method} ${metric.endpoint}`;
			if (!endpointMetrics.has(key)) {
				endpointMetrics.set(key, []);
			}
			endpointMetrics.get(key)?.push(metric);
		});

		endpointMetrics.forEach((endpointData, endpoint) => {
			aggregated.requestsByEndpoint[endpoint] = endpointData.length;

			const avgResponseTime =
				endpointData.reduce((sum, m) => sum + m.responseTime, 0) /
				endpointData.length;
			aggregated.averageResponseTimeByEndpoint[endpoint] = avgResponseTime;
		});

		// Identify slow queries (>2 seconds)
		aggregated.slowQueries = metrics
			.filter((m) => m.responseTime > 2000)
			.sort((a, b) => b.responseTime - a.responseTime)
			.slice(0, 10);

		return aggregated;
	}

	private static async updatePerformanceInsights(stats: any) {
		const cache = getCache();
		const insights = {
			recommendations: [] as string[],
			alerts: [] as string[],
			trends: {},
			lastUpdated: new Date(),
		};

		// Generate recommendations based on stats
		if (stats.averageResponseTime > 1000) {
			insights.recommendations.push(
				"Average response time is high. Consider adding more caching or optimizing database queries.",
			);
		}

		if (stats.errorRate > 5) {
			insights.alerts.push(
				`High error rate detected: ${stats.errorRate.toFixed(2)}%. Investigation recommended.`,
			);
		}

		if (stats.slowQueries.length > 5) {
			insights.recommendations.push(
				`${stats.slowQueries.length} slow queries detected. Review query optimization.`,
			);
		}

		// Endpoint-specific recommendations
		Object.entries(stats.averageResponseTimeByEndpoint).forEach(
			([endpoint, avgTime]) => {
				if ((avgTime as number) > 2000) {
					insights.recommendations.push(
						`Endpoint ${endpoint} is slow (${(avgTime as number).toFixed(0)}ms). Consider optimization.`,
					);
				}
			},
		);

		await cache.set("performance:insights", insights, { ttl: 3600 });
	}

	private static getDefaultStats() {
		return {
			totalRequests: 0,
			averageResponseTime: 0,
			medianResponseTime: 0,
			p95ResponseTime: 0,
			p99ResponseTime: 0,
			errorRate: 0,
			requestsByEndpoint: {},
			averageResponseTimeByEndpoint: {},
			slowQueries: [],
		};
	}
}

/**
 * Performance monitoring middleware for tRPC
 */
export function performanceMiddleware() {
	return async (opts: any) => {
		const startTime = Date.now();
		const { path, type, ctx } = opts;

		try {
			const result = await opts.next();
			const responseTime = Date.now() - startTime;

			// Record performance metric
			PerformanceMonitor.record({
				endpoint: path,
				method: type,
				responseTime,
				timestamp: new Date(),
				statusCode: 200,
				tenantId: ctx.tenant?.id,
				userId: ctx.user?.id,
			});

			// Add response time to headers for debugging
			if (result.headers) {
				result.headers["x-response-time"] = `${responseTime}ms`;
			}

			return result;
		} catch (error: any) {
			const responseTime = Date.now() - startTime;

			// Record error metric
			PerformanceMonitor.record({
				endpoint: path,
				method: type,
				responseTime,
				timestamp: new Date(),
				statusCode: error.code === "INTERNAL_SERVER_ERROR" ? 500 : 400,
				tenantId: ctx.tenant?.id,
				userId: ctx.user?.id,
				errorMessage: error.message,
			});

			throw error;
		}
	};
}

/**
 * Database query optimization helpers
 */
export class QueryOptimizer {
	/**
	 * Analyze database query patterns and suggest optimizations
	 */
	static async analyzeQueries() {
		// This would integrate with Prisma query logging
		// and provide optimization suggestions
		return {
			slowQueries: [],
			recommendations: [
				"Add index on client.tenantId for faster tenant isolation",
				"Consider pagination for large client lists",
				"Use select to fetch only required fields",
			],
			indexSuggestions: [
				"CREATE INDEX idx_client_tenant_id ON Client(tenantId)",
				"CREATE INDEX idx_tax_filing_client_due_date ON TaxFiling(clientId, dueDate)",
			],
		};
	}

	/**
	 * Monitor connection pool usage
	 */
	static async getConnectionPoolStats() {
		// This would integrate with Prisma connection pool monitoring
		return {
			activeConnections: 5,
			idleConnections: 15,
			totalConnections: 20,
			maxConnections: 50,
			utilizationRate: 40, // percentage
			waitingRequests: 0,
		};
	}
}
