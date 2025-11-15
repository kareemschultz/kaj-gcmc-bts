/**
 * Analytics tRPC Router
 *
 * Provides analytics, reports, and data insights
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Analytics router
 */
export const analyticsRouter = router({
	/**
	 * Get client analytics
	 * Requires: analytics:view permission
	 */
	clients: rbacProcedure("analytics", "view")
		.input(
			z
				.object({
					startDate: z.string().datetime().optional(),
					endDate: z.string().datetime().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate } = input || {};

			const where: Prisma.ClientWhereInput = { tenantId: ctx.tenantId };
			if (startDate || endDate) {
				where.createdAt = {};
				if (startDate) where.createdAt.gte = new Date(startDate);
				if (endDate) where.createdAt.lte = new Date(endDate);
			}

			const [total, byType, bySector, byRiskLevel, growth] = await Promise.all([
				prisma.client.count({ where }),
				prisma.client.groupBy({
					by: ["type"],
					where,
					_count: true,
				}),
				prisma.client.groupBy({
					by: ["sector"],
					where: { ...where, sector: { not: null } },
					_count: true,
				}),
				prisma.client.groupBy({
					by: ["riskLevel"],
					where: { ...where, riskLevel: { not: null } },
					_count: true,
				}),
				// Growth over last 12 months
				prisma.client.count({
					where: {
						tenantId: ctx.tenantId,
						createdAt: {
							gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
						},
					},
				}),
			]);

			return {
				total,
				byType,
				bySector,
				byRiskLevel,
				growth,
			};
		}),

	/**
	 * Get document analytics
	 * Requires: analytics:view permission
	 */
	documents: rbacProcedure("analytics", "view")
		.input(
			z
				.object({
					startDate: z.string().datetime().optional(),
					endDate: z.string().datetime().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate } = input || {};

			const where: Prisma.DocumentWhereInput = { tenantId: ctx.tenantId };
			if (startDate || endDate) {
				where.createdAt = {};
				if (startDate) where.createdAt.gte = new Date(startDate);
				if (endDate) where.createdAt.lte = new Date(endDate);
			}

			const [total, byStatus, byType, expiringCount, totalVersions] =
				await Promise.all([
					prisma.document.count({ where }),
					prisma.document.groupBy({
						by: ["status"],
						where,
						_count: true,
					}),
					prisma.document.groupBy({
						by: ["documentTypeId"],
						where,
						_count: true,
					}),
					prisma.document.count({
						where: {
							tenantId: ctx.tenantId,
							latestVersion: {
								expiryDate: {
									lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
									gte: new Date(),
								},
							},
						},
					}),
					prisma.documentVersion.count({
						where: {
							document: { tenantId: ctx.tenantId },
						},
					}),
				]);

			return {
				total,
				byStatus,
				byType,
				expiringCount,
				totalVersions,
				averageVersionsPerDocument: total > 0 ? totalVersions / total : 0,
			};
		}),

	/**
	 * Get filing analytics
	 * Requires: analytics:view permission
	 */
	filings: rbacProcedure("analytics", "view")
		.input(
			z
				.object({
					startDate: z.string().datetime().optional(),
					endDate: z.string().datetime().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate } = input || {};

			const where: Prisma.FilingWhereInput = { tenantId: ctx.tenantId };
			if (startDate || endDate) {
				where.createdAt = {};
				if (startDate) where.createdAt.gte = new Date(startDate);
				if (endDate) where.createdAt.lte = new Date(endDate);
			}

			const [total, byStatus, byType, overdueCount, submittedCount] =
				await Promise.all([
					prisma.filing.count({ where }),
					prisma.filing.groupBy({
						by: ["status"],
						where,
						_count: true,
					}),
					prisma.filing.groupBy({
						by: ["filingTypeId"],
						where,
						_count: true,
					}),
					prisma.filing.count({
						where: {
							tenantId: ctx.tenantId,
							status: { in: ["draft", "prepared"] },
							periodEnd: { lt: new Date() },
						},
					}),
					prisma.filing.count({
						where: {
							tenantId: ctx.tenantId,
							status: "submitted",
						},
					}),
				]);

			return {
				total,
				byStatus,
				byType,
				overdueCount,
				submittedCount,
				onTimeRate: total > 0 ? (submittedCount / total) * 100 : 0,
			};
		}),

	/**
	 * Get service request analytics
	 * Requires: analytics:view permission
	 */
	serviceRequests: rbacProcedure("analytics", "view")
		.input(
			z
				.object({
					startDate: z.string().datetime().optional(),
					endDate: z.string().datetime().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate } = input || {};

			const where: Prisma.ServiceRequestWhereInput = { tenantId: ctx.tenantId };
			if (startDate || endDate) {
				where.createdAt = {};
				if (startDate) where.createdAt.gte = new Date(startDate);
				if (endDate) where.createdAt.lte = new Date(endDate);
			}

			const [total, byStatus, byService, byPriority, completedCount] =
				await Promise.all([
					prisma.serviceRequest.count({ where }),
					prisma.serviceRequest.groupBy({
						by: ["status"],
						where,
						_count: true,
					}),
					prisma.serviceRequest.groupBy({
						by: ["serviceId"],
						where,
						_count: true,
					}),
					prisma.serviceRequest.groupBy({
						by: ["priority"],
						where: { ...where, priority: { not: null } },
						_count: true,
					}),
					prisma.serviceRequest.count({
						where: {
							tenantId: ctx.tenantId,
							status: "completed",
						},
					}),
				]);

			return {
				total,
				byStatus,
				byService,
				byPriority,
				completedCount,
				completionRate: total > 0 ? (completedCount / total) * 100 : 0,
			};
		}),

	/**
	 * Get compliance analytics
	 * Requires: analytics:view permission
	 */
	compliance: rbacProcedure("analytics", "view").query(async ({ ctx }) => {
		const [
			totalScores,
			averageScore,
			byLevel,
			clientsAboveThreshold,
			clientsBelowThreshold,
		] = await Promise.all([
			prisma.complianceScore.count({ where: { tenantId: ctx.tenantId } }),
			prisma.complianceScore.aggregate({
				where: { tenantId: ctx.tenantId },
				_avg: { scoreValue: true },
			}),
			prisma.complianceScore.groupBy({
				by: ["level"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.complianceScore.count({
				where: { tenantId: ctx.tenantId, scoreValue: { gte: 70 } },
			}),
			prisma.complianceScore.count({
				where: { tenantId: ctx.tenantId, scoreValue: { lt: 50 } },
			}),
		]);

		return {
			totalScores,
			averageScore: averageScore._avg.scoreValue || 0,
			byLevel,
			clientsAboveThreshold,
			clientsBelowThreshold,
		};
	}),

	/**
	 * Get revenue analytics (from service requests)
	 * Requires: analytics:view permission
	 */
	revenue: rbacProcedure("analytics", "view")
		.input(
			z
				.object({
					startDate: z.string().datetime().optional(),
					endDate: z.string().datetime().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate } = input || {};

			const where: Prisma.ServiceRequestWhereInput = {
				tenantId: ctx.tenantId,
				status: "completed",
			};
			if (startDate || endDate) {
				where.updatedAt = {};
				if (startDate) where.updatedAt.gte = new Date(startDate);
				if (endDate) where.updatedAt.lte = new Date(endDate);
			}

			const serviceRequests = await prisma.serviceRequest.findMany({
				where,
				include: {
					service: {
						select: {
							basePrice: true,
						},
					},
				},
			});

			const totalRevenue = serviceRequests.reduce(
				(sum: number, sr: (typeof serviceRequests)[number]) =>
					sum + (sr.service.basePrice || 0),
				0,
			);

			const byService = serviceRequests.reduce(
				(
					acc: Record<
						number,
						{ serviceId: number; count: number; revenue: number }
					>,
					sr: (typeof serviceRequests)[number],
				) => {
					if (!acc[sr.serviceId]) {
						acc[sr.serviceId] = {
							serviceId: sr.serviceId,
							count: 0,
							revenue: 0,
						};
					}
					acc[sr.serviceId].count++;
					acc[sr.serviceId].revenue += sr.service.basePrice || 0;
					return acc;
				},
				{} as Record<
					number,
					{ serviceId: number; count: number; revenue: number }
				>,
			);

			return {
				totalRevenue,
				totalRequests: serviceRequests.length,
				averageValue:
					serviceRequests.length > 0
						? totalRevenue / serviceRequests.length
						: 0,
				byService: Object.values(byService),
			};
		}),

	/**
	 * Get user activity analytics
	 * Requires: analytics:view permission
	 */
	userActivity: rbacProcedure("analytics", "view")
		.input(
			z
				.object({
					startDate: z.string().datetime().optional(),
					endDate: z.string().datetime().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate } = input || {};

			const where: Prisma.AuditLogWhereInput = { tenantId: ctx.tenantId };
			if (startDate || endDate) {
				where.createdAt = {};
				if (startDate) where.createdAt.gte = new Date(startDate);
				if (endDate) where.createdAt.lte = new Date(endDate);
			}

			const auditLogs = await prisma.auditLog.findMany({
				where,
				select: {
					actorUserId: true,
					action: true,
					entityType: true,
					createdAt: true,
				},
			});

			const byUser = auditLogs.reduce(
				(
					acc: Record<string, { userId: string; count: number }>,
					log: (typeof auditLogs)[number],
				) => {
					if (!log.actorUserId) return acc;
					if (!acc[log.actorUserId]) {
						acc[log.actorUserId] = { userId: log.actorUserId, count: 0 };
					}
					acc[log.actorUserId].count++;
					return acc;
				},
				{} as Record<string, { userId: string; count: number }>,
			);

			const byAction = auditLogs.reduce(
				(
					acc: Record<string, { action: string; count: number }>,
					log: (typeof auditLogs)[number],
				) => {
					if (!acc[log.action]) {
						acc[log.action] = { action: log.action, count: 0 };
					}
					acc[log.action].count++;
					return acc;
				},
				{} as Record<string, { action: string; count: number }>,
			);

			return {
				totalActions: auditLogs.length,
				byUser: Object.values(byUser),
				byAction: Object.values(byAction),
			};
		}),
});
