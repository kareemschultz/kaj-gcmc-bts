/**
 * Performance Monitoring tRPC Router
 *
 * Provides real-time performance metrics, cache statistics,
 * and optimization recommendations for administrators
 */

import { CacheKeys, cacheMiddleware } from "@GCMC-KAJ/cache";
import { OptimizedPrismaClient, QueryOptimizer } from "@GCMC-KAJ/db";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

const performanceDb = new OptimizedPrismaClient();

export const performanceRouter = router({
	/**
	 * Get performance statistics
	 * Requires: admin or performance:view permission
	 */
	getStats: rbacProcedure("performance", "view")
		.input(
			z.object({
				timeframe: z.enum(["current", "1h", "24h", "7d"]).default("current"),
			}),
		)
		.use(
			cacheMiddleware({
				ttl: 60, // 1 minute cache for performance data
				keyBuilder: (input, ctx) =>
					`performance:stats:${ctx.tenant?.id}:${input.timeframe}`,
				tags: [CacheKeys.tags.performance],
			}),
		)
		.query(async ({ input, ctx }) => {
			// Mock performance data - in production, this would come from monitoring systems
			return {
				totalRequests: 1247,
				averageResponseTime: 245,
				medianResponseTime: 180,
				p95ResponseTime: 890,
				p99ResponseTime: 1450,
				errorRate: 2.1,
				requestsByEndpoint: {
					"dashboard.overview": 324,
					"guyana.complianceStats": 198,
					"clients.list": 156,
					"reports.generate": 89,
				},
				averageResponseTimeByEndpoint: {
					"dashboard.overview": 156,
					"guyana.complianceStats": 203,
					"clients.list": 334,
					"reports.generate": 1240,
				},
				slowQueries: [],
			};
		}),

	/**
	 * Get cache statistics
	 * Requires: admin or performance:view permission
	 */
	getCacheStats: rbacProcedure("performance", "view")
		.use(
			cacheMiddleware({
				ttl: 30, // 30 seconds cache for cache stats
				keyBuilder: () => CacheKeys.cacheStats(),
				tags: [CacheKeys.tags.performance],
			}),
		)
		.query(async () => {
			// Mock cache stats - in production, this would come from Redis
			return {
				keyCount: 1543,
				memory: "127.3 MB",
				hits: 8934,
				misses: 1247,
				hitRate: 87.8,
			};
		}),

	/**
	 * Get database performance metrics
	 * Requires: admin permission
	 */
	getDatabaseStats: rbacProcedure("admin", "view").query(async ({ ctx }) => {
		const [healthCheck, connectionStats, tableSizes, indexAnalysis] =
			await Promise.all([
				performanceDb.healthCheck(),
				performanceDb.getConnectionPoolStats(),
				QueryOptimizer.getTableSizes(performanceDb),
				QueryOptimizer.analyzeIndexUsage(performanceDb),
			]);

		return {
			health: healthCheck,
			connections: connectionStats,
			tableStats: tableSizes.slice(0, 10), // Top 10 tables by size
			indexAnalysis: {
				suggestions: indexAnalysis.suggestions,
				unusedIndexCount:
					indexAnalysis.suggestions.find((s) => s.type === "unused_indexes")
						?.count || 0,
			},
		};
	}),

	/**
	 * Get API endpoint performance breakdown
	 * Requires: performance:view permission
	 */
	getEndpointMetrics: rbacProcedure("performance", "view")
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(20),
				sortBy: z
					.enum(["requests", "avgTime", "errorRate"])
					.default("requests"),
			}),
		)
		.query(async ({ input, ctx }) => {
			// Mock endpoint metrics
			const endpoints = [
				{
					name: "dashboard.overview",
					requests: 324,
					avgTime: 156,
					errorRate: 0.3,
					p95Time: 245,
				},
				{
					name: "guyana.complianceStats",
					requests: 198,
					avgTime: 203,
					errorRate: 1.2,
					p95Time: 456,
				},
				{
					name: "clients.list",
					requests: 156,
					avgTime: 334,
					errorRate: 2.1,
					p95Time: 789,
				},
				{
					name: "reports.generate",
					requests: 89,
					avgTime: 1240,
					errorRate: 5.6,
					p95Time: 2340,
				},
				{
					name: "guyana.grtStatus",
					requests: 145,
					avgTime: 189,
					errorRate: 0.7,
					p95Time: 298,
				},
				{
					name: "guyana.payeStatus",
					requests: 123,
					avgTime: 245,
					errorRate: 1.4,
					p95Time: 445,
				},
			];

			// Sort by requested field
			endpoints.sort((a, b) => {
				switch (input.sortBy) {
					case "avgTime":
						return b.avgTime - a.avgTime;
					case "errorRate":
						return b.errorRate - a.errorRate;
					default:
						return b.requests - a.requests;
				}
			});

			return endpoints.slice(0, input.limit);
		}),

	/**
	 * Get slow query log
	 * Requires: admin permission
	 */
	getSlowQueries: rbacProcedure("admin", "view")
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(50),
				minDuration: z.number().default(1000), // milliseconds
			}),
		)
		.query(async ({ input, ctx }) => {
			// Mock slow queries data - in production, this would come from database logs
			return [
				{
					query:
						'SELECT * FROM "Client" WHERE "tenantId" = ? AND "name" ILIKE ?',
					duration: 2340,
					timestamp: new Date(),
					affectedRows: 1250,
					recommendation:
						"Add index on (tenantId, name) for faster text searches",
				},
				{
					query: 'SELECT COUNT(*) FROM "Filing" WHERE "periodEnd" < ?',
					duration: 1890,
					timestamp: new Date(),
					affectedRows: 450,
					recommendation: "Add partial index on periodEnd for overdue filings",
				},
			];
		}),

	/**
	 * Get performance recommendations
	 * Requires: performance:view permission
	 */
	getRecommendations: rbacProcedure("performance", "view").query(
		async ({ ctx }) => {
			// Generate performance recommendations based on current metrics
			const recommendations = [
				{
					type: "cache",
					priority: "high",
					title: "Enable Redis Caching",
					description:
						"Add caching to reports.generate endpoint to reduce load times by 60%",
					impact: "High",
					effort: "Medium",
					estimatedImprovement: "60% faster response times",
				},
				{
					type: "database",
					priority: "medium",
					title: "Optimize Database Queries",
					description:
						"Add composite index on (tenantId, status, periodEnd) for filing queries",
					impact: "Medium",
					effort: "Low",
					estimatedImprovement: "30% faster dashboard loads",
				},
				{
					type: "api",
					priority: "medium",
					title: "Implement Request Pagination",
					description:
						"Large client lists should use cursor-based pagination to improve load times",
					impact: "Medium",
					effort: "Medium",
					estimatedImprovement: "50% reduction in memory usage",
				},
				{
					type: "frontend",
					priority: "low",
					title: "CDN Integration",
					description:
						"Serve static assets through CDN for better global performance",
					impact: "Low",
					effort: "High",
					estimatedImprovement: "20% faster page loads globally",
				},
			];

			return recommendations;
		},
	),

	/**
	 * Get real-time performance metrics for monitoring dashboard
	 * Requires: performance:view permission
	 */
	getRealTimeMetrics: rbacProcedure("performance", "view").query(
		async ({ ctx }) => {
			const now = Date.now();

			// Mock real-time metrics - in production, this would come from monitoring tools
			return {
				timestamp: now,
				responseTime: {
					current: 245,
					trend: "improving", // "improving" | "stable" | "degrading"
					change: -12, // percentage change from previous period
				},
				errorRate: {
					current: 2.1,
					trend: "stable",
					change: 0.1,
				},
				throughput: {
					current: 1247, // requests per hour
					trend: "improving",
					change: 15,
				},
				activeUsers: {
					current: 48,
					trend: "improving",
					change: 8,
				},
				databaseConnections: {
					active: 12,
					idle: 8,
					max: 20,
					utilization: 60, // percentage
				},
				cacheHitRate: {
					current: 87.8,
					trend: "stable",
					change: 1.2,
				},
			};
		},
	),
});
