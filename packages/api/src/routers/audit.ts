/**
 * Audit Router
 *
 * tRPC routes for audit logging and activity tracking
 * Provides endpoints for viewing audit logs, user activity, and generating reports
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import type { AuditQueryOptions } from '../application/services/AuditService';

// Input validation schemas
const AuditQuerySchema = z.object({
	actorUserId: z.string().optional(),
	clientId: z.number().optional(),
	entityType: z.string().optional(),
	action: z.string().optional(),
	dateRange: z.object({
		from: z.date(),
		to: z.date(),
	}).optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	orderBy: z.enum(['createdAt', 'action', 'entityType']).default('createdAt'),
	order: z.enum(['asc', 'desc']).default('desc'),
});

const EntityAuditSchema = z.object({
	entityType: z.string(),
	entityId: z.union([z.number(), z.string()]),
});

const UserActivitySchema = z.object({
	userId: z.string(),
	limit: z.number().min(1).max(200).default(100),
});

const ClientActivitySchema = z.object({
	clientId: z.number(),
	limit: z.number().min(1).max(200).default(100),
});

const AuditReportSchema = z.object({
	reportType: z.enum(['user_activity', 'client_activity', 'system_events', 'security_events']),
	dateRange: z.object({
		from: z.date(),
		to: z.date(),
	}),
	filters: z.object({
		userIds: z.array(z.string()).optional(),
		clientIds: z.array(z.number()).optional(),
		actions: z.array(z.string()).optional(),
		entityTypes: z.array(z.string()).optional(),
	}).optional(),
	format: z.enum(['json', 'csv']).default('json'),
});

export const auditRouter = createTRPCRouter({
	/**
	 * Get paginated audit logs with filtering
	 */
	getLogs: protectedProcedure
		.input(AuditQuerySchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.auditService) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Audit service not available',
				});
			}

			if (!ctx.user?.tenantId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'User not associated with a tenant',
				});
			}

			const queryOptions: AuditQueryOptions = {
				tenantId: ctx.user.tenantId,
				...input,
			};

			const [logs, total] = await Promise.all([
				ctx.auditService.getAuditLogs(queryOptions),
				ctx.auditService.getAuditLogCount(queryOptions),
			]);

			return {
				logs,
				total,
				hasMore: input.offset + input.limit < total,
				nextOffset: input.offset + input.limit,
			};
		}),

	/**
	 * Get audit logs for a specific entity
	 */
	getEntityLogs: protectedProcedure
		.input(EntityAuditSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.auditService || !ctx.user?.tenantId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Audit service not available or user not authenticated',
				});
			}

			const logs = await ctx.auditService.getAuditLogsByEntity(
				ctx.user.tenantId,
				input.entityType,
				input.entityId
			);

			return { logs };
		}),

	/**
	 * Get activity logs for a specific user
	 */
	getUserActivity: protectedProcedure
		.input(UserActivitySchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.auditService || !ctx.user?.tenantId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Audit service not available or user not authenticated',
				});
			}

			const logs = await ctx.auditService.getUserActivity(
				ctx.user.tenantId,
				input.userId,
				input.limit
			);

			return { logs };
		}),

	/**
	 * Get activity logs for a specific client
	 */
	getClientActivity: protectedProcedure
		.input(ClientActivitySchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.auditService || !ctx.user?.tenantId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Audit service not available or user not authenticated',
				});
			}

			const logs = await ctx.auditService.getClientActivity(
				ctx.user.tenantId,
				input.clientId,
				input.limit
			);

			return { logs };
		}),

	/**
	 * Get current user's own activity
	 */
	getMyActivity: protectedProcedure
		.input(z.object({
			limit: z.number().min(1).max(200).default(50),
		}))
		.query(async ({ ctx, input }) => {
			if (!ctx.auditService || !ctx.user?.tenantId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Audit service not available or user not authenticated',
				});
			}

			const logs = await ctx.auditService.getUserActivity(
				ctx.user.tenantId,
				ctx.user.id,
				input.limit
			);

			return { logs };
		}),

	/**
	 * Get audit statistics for dashboard
	 */
	getStats: protectedProcedure
		.input(z.object({
			dateRange: z.object({
				from: z.date(),
				to: z.date(),
			}).optional(),
		}))
		.query(async ({ ctx, input }) => {
			if (!ctx.auditService || !ctx.user?.tenantId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Audit service not available or user not authenticated',
				});
			}

			const tenantId = ctx.user.tenantId;
			const dateRange = input.dateRange;

			// Get counts for different entity types and actions
			const [
				totalLogs,
				userActions,
				documentActions,
				clientActions,
				complianceActions,
				securityEvents,
			] = await Promise.all([
				ctx.auditService.getAuditLogCount({ tenantId, dateRange }),
				ctx.auditService.getAuditLogCount({
					tenantId,
					entityType: 'user',
					dateRange
				}),
				ctx.auditService.getAuditLogCount({
					tenantId,
					entityType: 'document',
					dateRange
				}),
				ctx.auditService.getAuditLogCount({
					tenantId,
					entityType: 'client',
					dateRange
				}),
				ctx.auditService.getAuditLogCount({
					tenantId,
					entityType: 'compliance',
					dateRange
				}),
				ctx.auditService.getAuditLogCount({
					tenantId,
					action: 'security.login_attempt',
					dateRange
				}),
			]);

			// Get top active users (last 30 days)
			const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
			const recentLogs = await ctx.auditService.getAuditLogs({
				tenantId,
				dateRange: { from: thirtyDaysAgo, to: new Date() },
				limit: 1000,
			});

			// Count actions by user
			const userActivityMap = new Map<string, { count: number; user: any }>();
			recentLogs.forEach(log => {
				if (log.actorUserId && log.actor) {
					const current = userActivityMap.get(log.actorUserId) || {
						count: 0,
						user: log.actor
					};
					current.count++;
					userActivityMap.set(log.actorUserId, current);
				}
			});

			const topUsers = Array.from(userActivityMap.entries())
				.sort(([, a], [, b]) => b.count - a.count)
				.slice(0, 10)
				.map(([userId, data]) => ({
					userId,
					user: data.user,
					actionCount: data.count,
				}));

			// Count actions by type
			const actionCounts: Record<string, number> = {};
			recentLogs.forEach(log => {
				actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
			});

			const topActions = Object.entries(actionCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 10)
				.map(([action, count]) => ({ action, count }));

			return {
				totalLogs,
				categoryCounts: {
					user: userActions,
					document: documentActions,
					client: clientActions,
					compliance: complianceActions,
					security: securityEvents,
				},
				topUsers,
				topActions,
				timeframe: input.dateRange ? {
					from: input.dateRange.from,
					to: input.dateRange.to,
				} : {
					from: thirtyDaysAgo,
					to: new Date(),
				},
			};
		}),

	/**
	 * Generate audit report
	 */
	generateReport: protectedProcedure
		.input(AuditReportSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.auditService || !ctx.user?.tenantId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Audit service not available or user not authenticated',
				});
			}

			const tenantId = ctx.user.tenantId;

			// Build query based on report type and filters
			const queryOptions: AuditQueryOptions = {
				tenantId,
				dateRange: input.dateRange,
				limit: 10000, // Large limit for reports
			};

			// Apply filters based on report type
			switch (input.reportType) {
				case 'user_activity':
					if (input.filters?.userIds?.length) {
						// For multiple users, we'll need to make multiple queries
						// For simplicity, taking the first user ID
						queryOptions.actorUserId = input.filters.userIds[0];
					}
					break;
				case 'client_activity':
					if (input.filters?.clientIds?.length) {
						queryOptions.clientId = input.filters.clientIds[0];
					}
					break;
				case 'system_events':
					queryOptions.entityType = 'system';
					break;
				case 'security_events':
					// Security events can be filtered by specific actions
					if (input.filters?.actions?.length) {
						queryOptions.action = input.filters.actions[0];
					}
					break;
			}

			const logs = await ctx.auditService.getAuditLogs(queryOptions);

			// Format based on requested format
			if (input.format === 'csv') {
				// Convert to CSV format
				const csvHeader = 'Date,User,Action,Entity Type,Entity ID,Client,Changes,IP Address\n';
				const csvRows = logs.map(log => [
					log.createdAt.toISOString(),
					log.actor?.name || 'System',
					log.action,
					log.entityType,
					log.entityId,
					log.client?.name || '',
					JSON.stringify(log.changes).replace(/"/g, '""'),
					log.ipAddress || '',
				].join(',')).join('\n');

				return {
					reportType: input.reportType,
					format: 'csv',
					data: csvHeader + csvRows,
					recordCount: logs.length,
					generatedAt: new Date(),
				};
			}

			// Return JSON format
			return {
				reportType: input.reportType,
				format: 'json',
				data: logs,
				recordCount: logs.length,
				generatedAt: new Date(),
				summary: {
					dateRange: input.dateRange,
					totalRecords: logs.length,
					uniqueUsers: new Set(logs.map(log => log.actorUserId)).size,
					uniqueActions: new Set(logs.map(log => log.action)).size,
					uniqueClients: new Set(logs.map(log => log.clientId).filter(Boolean)).size,
				},
			};
		}),

	/**
	 * Get audit log summary for the last 24 hours (for dashboard widget)
	 */
	getRecentSummary: protectedProcedure
		.query(async ({ ctx }) => {
			if (!ctx.auditService || !ctx.user?.tenantId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Audit service not available or user not authenticated',
				});
			}

			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const now = new Date();

			const logs = await ctx.auditService.getAuditLogs({
				tenantId: ctx.user.tenantId,
				dateRange: { from: yesterday, to: now },
				limit: 50,
			});

			const actionCounts: Record<string, number> = {};
			const hourlyActivity: Record<string, number> = {};

			logs.forEach(log => {
				// Count actions
				actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

				// Count hourly activity
				const hour = log.createdAt.getHours();
				const hourKey = `${hour}:00`;
				hourlyActivity[hourKey] = (hourlyActivity[hourKey] || 0) + 1;
			});

			return {
				totalActions: logs.length,
				actionBreakdown: actionCounts,
				hourlyActivity,
				recentLogs: logs.slice(0, 10), // Last 10 actions
				timeframe: {
					from: yesterday,
					to: now,
				},
			};
		}),
});

export type AuditRouter = typeof auditRouter;