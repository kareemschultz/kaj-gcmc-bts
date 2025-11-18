/**
 * Database Optimization Utilities
 *
 * Provides optimized query patterns, connection pool management,
 * and performance monitoring for Prisma
 */

import { PrismaClient } from "@prisma/client";

/**
 * Optimized Prisma client with performance enhancements
 */
export class OptimizedPrismaClient extends PrismaClient {
	constructor() {
		// Helper function to get database URL with connection pooling
		const getDatabaseUrl = (): string => {
			const baseUrl = process.env.DATABASE_URL;

			if (!baseUrl) {
				throw new Error("DATABASE_URL is not set");
			}

			// Add connection pooling parameters if not already present and in production
			if (
				process.env.NODE_ENV === "production" &&
				!baseUrl.includes("connection_limit")
			) {
				const url = new URL(baseUrl);
				url.searchParams.set("connection_limit", "20");
				url.searchParams.set("pool_timeout", "20");
				url.searchParams.set("connect_timeout", "10");
				return url.toString();
			}

			return baseUrl;
		};

		super({
			log: [
				{ emit: "event", level: "query" },
				{ emit: "event", level: "error" },
				{ emit: "event", level: "info" },
				{ emit: "event", level: "warn" },
			],
			datasources: {
				db: {
					url: getDatabaseUrl(),
				},
			},
		});

		this.setupQueryLogging();
		this.setupConnectionPoolOptimization();
	}

	private setupQueryLogging() {
		// Log slow queries for performance monitoring
		this.$on("query", (e) => {
			if (e.duration > 1000) {
				// Log queries taking more than 1 second
				console.warn("Slow query detected:", {
					query: e.query,
					params: e.params,
					duration: `${e.duration}ms`,
					timestamp: e.timestamp,
				});
			}
		});

		this.$on("error", (e) => {
			console.error("Database error:", e);
		});
	}

	private setupConnectionPoolOptimization() {
		// Connection pool will be optimized via DATABASE_URL parameters:
		// ?connection_limit=20&pool_timeout=20&connect_timeout=60
	}

	/**
	 * Optimized client list query with proper indexing and pagination
	 */
	async getOptimizedClientList(params: {
		tenantId: number;
		limit?: number;
		offset?: number;
		search?: string;
		businessType?: string;
		status?: string;
	}) {
		const {
			tenantId,
			limit = 50,
			offset = 0,
			search,
			businessType,
			status,
		} = params;

		const where = {
			tenantId,
			...(search && {
				OR: [
					{ name: { contains: search, mode: "insensitive" as const } },
					{ email: { contains: search, mode: "insensitive" as const } },
					{ taxId: { contains: search, mode: "insensitive" as const } },
				],
			}),
			...(businessType && { businessType }),
			...(status && { status }),
		};

		const [clients, total] = await Promise.all([
			this.client.findMany({
				where,
				select: {
					id: true,
					name: true,
					email: true,
					businessType: true,
					status: true,
					taxId: true,
					createdAt: true,
					_count: {
						select: {
							taxFilings: true,
							penalties: true,
						},
					},
				},
				orderBy: [
					{ status: "asc" }, // Active clients first
					{ name: "asc" },
				],
				take: limit,
				skip: offset,
			}),
			this.client.count({ where }),
		]);

		return {
			clients,
			total,
			hasMore: offset + limit < total,
			pageInfo: {
				page: Math.floor(offset / limit) + 1,
				totalPages: Math.ceil(total / limit),
				limit,
				offset,
			},
		};
	}

	/**
	 * Optimized compliance statistics with single aggregation query
	 */
	async getComplianceStats(tenantId: number) {
		// Use a single raw query for better performance
		const stats = await this.$queryRaw<
			Array<{
				metric: string;
				value: number;
			}>
		>`
      SELECT
        'totalClients' as metric, COUNT(*)::integer as value
      FROM "Client"
      WHERE "tenantId" = ${tenantId}

      UNION ALL

      SELECT
        'soleTraders' as metric, COUNT(*)::integer as value
      FROM "Client"
      WHERE "tenantId" = ${tenantId} AND "businessType" = 'SOLE_TRADER'

      UNION ALL

      SELECT
        'companies' as metric, COUNT(*)::integer as value
      FROM "Client"
      WHERE "tenantId" = ${tenantId} AND "businessType" = 'COMPANY'

      UNION ALL

      SELECT
        'overdueFilings' as metric, COUNT(*)::integer as value
      FROM "TaxFiling"
      WHERE "tenantId" = ${tenantId}
        AND "dueDate" < NOW()
        AND "status" != 'FILED'

      UNION ALL

      SELECT
        'upcomingDeadlines' as metric, COUNT(*)::integer as value
      FROM "Deadline"
      WHERE "tenantId" = ${tenantId}
        AND "dueDate" BETWEEN NOW() AND NOW() + INTERVAL '30 days'

      UNION ALL

      SELECT
        'totalPenalties' as metric, COALESCE(SUM("amount"), 0)::integer as value
      FROM "Penalty"
      WHERE "tenantId" = ${tenantId} AND "status" = 'OUTSTANDING'

      UNION ALL

      SELECT
        'activeGRAFilings' as metric, COUNT(*)::integer as value
      FROM "TaxFiling"
      WHERE "tenantId" = ${tenantId}
        AND "type" = 'GRT'
        AND "status" = 'IN_PROGRESS'

      UNION ALL

      SELECT
        'compliantClients' as metric, COUNT(DISTINCT "clientId")::integer as value
      FROM "Client" c
      INNER JOIN "TaxFiling" tf ON c.id = tf."clientId"
      WHERE c."tenantId" = ${tenantId}
        AND tf."status" = 'FILED'
        AND tf."dueDate" >= NOW() - INTERVAL '90 days'
    `;

		// Transform array result to object
		return stats.reduce(
			(acc, { metric, value }) => {
				acc[metric] = value;
				return acc;
			},
			{} as Record<string, number>,
		);
	}

	/**
	 * Bulk operations for improved performance
	 */
	async bulkUpdateClientStatus(
		tenantId: number,
		clientIds: number[],
		status: string,
	) {
		return this.client.updateMany({
			where: {
				tenantId,
				id: { in: clientIds },
			},
			data: { status },
		});
	}

	/**
	 * Optimized search with full-text capabilities
	 */
	async searchClients(params: {
		tenantId: number;
		query: string;
		limit?: number;
	}) {
		const { tenantId, query, limit = 10 } = params;

		// Use PostgreSQL full-text search if available
		return this.$queryRaw<
			Array<{
				id: number;
				name: string;
				email: string;
				taxId: string;
				businessType: string;
				relevance: number;
			}>
		>`
      SELECT
        id,
        name,
        email,
        "taxId",
        "businessType",
        ts_rank(
          to_tsvector('english', name || ' ' || email || ' ' || COALESCE("taxId", '')),
          plainto_tsquery('english', ${query})
        ) as relevance
      FROM "Client"
      WHERE "tenantId" = ${tenantId}
        AND to_tsvector('english', name || ' ' || email || ' ' || COALESCE("taxId", ''))
        @@ plainto_tsquery('english', ${query})
      ORDER BY relevance DESC, name ASC
      LIMIT ${limit}
    `;
	}

	/**
	 * Connection pool status monitoring
	 */
	async getConnectionPoolStats() {
		try {
			const result = await this.$queryRaw<
				Array<{
					state: string;
					count: number;
				}>
			>`
        SELECT state, count(*)::integer as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;

			return result;
		} catch (error) {
			console.error("Failed to get connection pool stats:", error);
			return [];
		}
	}

	/**
	 * Database health check
	 */
	async healthCheck() {
		try {
			const startTime = Date.now();
			await this.$queryRaw`SELECT 1`;
			const responseTime = Date.now() - startTime;

			const stats = await this.getConnectionPoolStats();

			return {
				status: "healthy",
				responseTime,
				connectionPool: stats,
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				status: "unhealthy",
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date(),
			};
		}
	}
}

/**
 * Query optimization helpers
 */
export class QueryOptimizer {
	/**
	 * Analyze and suggest database indexes
	 */
	static async analyzeIndexUsage(prisma: PrismaClient) {
		try {
			const indexStats = await prisma.$queryRaw<
				Array<{
					tablename: string;
					indexname: string;
					idx_scan: number;
					idx_tup_read: number;
					idx_tup_fetch: number;
				}>
			>`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `;

			const suggestions = [];

			// Identify unused indexes
			const unusedIndexes = indexStats.filter((idx) => idx.idx_scan === 0);
			if (unusedIndexes.length > 0) {
				suggestions.push({
					type: "unused_indexes",
					count: unusedIndexes.length,
					message:
						"Consider dropping unused indexes to improve write performance",
					indexes: unusedIndexes.map((idx) => idx.indexname),
				});
			}

			// Suggest missing indexes based on common query patterns
			suggestions.push({
				type: "missing_indexes",
				recommendations: [
					'CREATE INDEX CONCURRENTLY idx_client_tenant_status ON "Client"("tenantId", "status")',
					'CREATE INDEX CONCURRENTLY idx_tax_filing_client_due ON "TaxFiling"("clientId", "dueDate")',
					'CREATE INDEX CONCURRENTLY idx_penalty_tenant_status ON "Penalty"("tenantId", "status")',
					'CREATE INDEX CONCURRENTLY idx_deadline_tenant_due ON "Deadline"("tenantId", "dueDate")',
				],
			});

			return {
				indexStats,
				suggestions,
				analyzedAt: new Date(),
			};
		} catch (error) {
			console.error("Index analysis failed:", error);
			return {
				indexStats: [],
				suggestions: [],
				error: error instanceof Error ? error.message : "Unknown error",
				analyzedAt: new Date(),
			};
		}
	}

	/**
	 * Get table size information
	 */
	static async getTableSizes(prisma: PrismaClient) {
		try {
			return await prisma.$queryRaw<
				Array<{
					table_name: string;
					size_bytes: number;
					size_human: string;
					row_count: number;
				}>
			>`
        SELECT
          schemaname||'.'||tablename as table_name,
          pg_total_relation_size(schemaname||'.'||tablename)::bigint as size_bytes,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_human,
          (SELECT n_tup_ins - n_tup_del FROM pg_stat_user_tables WHERE schemaname||'.'||tablename = pg_stat_user_tables.schemaname||'.'||pg_stat_user_tables.relname) as row_count
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;
		} catch (error) {
			console.error("Failed to get table sizes:", error);
			return [];
		}
	}
}

// Export singleton instance
export const optimizedDb = new OptimizedPrismaClient();
