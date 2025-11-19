/**
 * Client Analytics tRPC Router
 *
 * Provides comprehensive analytics data for client dashboards including:
 * - Compliance statistics and trends
 * - Document analytics and status breakdowns
 * - Filing analytics and deadlines
 * - Service request analytics
 * - Activity timeline data
 */

import { CacheKeys, cacheMiddleware } from "@GCMC-KAJ/cache";
import prisma from "@GCMC-KAJ/db";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Client Analytics router - comprehensive analytics endpoints for client dashboards
 */
export const clientAnalyticsRouter = router({
	/**
	 * Get client by ID with basic information
	 * Requires: clients:view permission
	 */
	getById: rbacProcedure("clients", "view")
		.input(z.number())
		.use(
			cacheMiddleware({
				ttl: 300, // 5 minutes cache
				keyBuilder: (input, ctx) =>
					CacheKeys.clientProfile(ctx.tenant?.id, input),
				tags: [CacheKeys.tags.clients, CacheKeys.tags.dashboard],
			}),
		)
		.query(async ({ input: clientId, ctx }) => {
			const client = await prisma.client.findUnique({
				where: {
					id: clientId,
					tenantId: ctx.tenantId,
				},
				select: {
					id: true,
					name: true,
					email: true,
					type: true,
					sector: true,
					status: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!client) {
				throw new Error("Client not found");
			}

			return client;
		}),

	/**
	 * Get comprehensive compliance statistics for a client
	 * Requires: compliance:view permission
	 */
	complianceStats: rbacProcedure("compliance", "view")
		.input(z.number())
		.use(
			cacheMiddleware({
				ttl: 180, // 3 minutes cache
				keyBuilder: (input, ctx) =>
					CacheKeys.clientCompliance(ctx.tenant?.id, input),
				tags: [CacheKeys.tags.compliance, CacheKeys.tags.clients],
			}),
		)
		.query(async ({ input: clientId, ctx }) => {
			// Get compliance score and breakdown
			const complianceScore = await prisma.complianceScore.findFirst({
				where: {
					clientId,
					tenantId: ctx.tenantId,
				},
				orderBy: { calculatedAt: "desc" },
			});

			// Calculate monthly compliance trend (last 12 months)
			const monthlyTrend = await prisma.$queryRaw<
				Array<{
					month: string;
					score: number;
					filings: number;
					documents: number;
				}>
			>`
        SELECT
          TO_CHAR(date_trunc('month', cs."calculatedAt"), 'YYYY-MM') as month,
          AVG(cs."score")::integer as score,
          COUNT(DISTINCT f.id)::integer as filings,
          COUNT(DISTINCT d.id)::integer as documents
        FROM "ComplianceScore" cs
        LEFT JOIN "Filing" f ON f."clientId" = cs."clientId"
          AND date_trunc('month', f."createdAt") = date_trunc('month', cs."calculatedAt")
        LEFT JOIN "Document" d ON d."clientId" = cs."clientId"
          AND date_trunc('month', d."createdAt") = date_trunc('month', cs."calculatedAt")
        WHERE cs."clientId" = ${clientId}
          AND cs."tenantId" = ${ctx.tenantId}
          AND cs."calculatedAt" >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', cs."calculatedAt")
        ORDER BY month ASC
      `;

			// Get outstanding fees and penalties
			const penalties = await prisma.penalty.aggregate({
				where: {
					clientId,
					tenantId: ctx.tenantId,
					status: "OUTSTANDING",
				},
				_sum: {
					amount: true,
				},
				_count: {
					id: true,
				},
			});

			// Get compliance alerts
			const alerts = await prisma.filing.findMany({
				where: {
					clientId,
					tenantId: ctx.tenantId,
					status: { in: ["draft", "prepared"] },
					periodEnd: { lt: new Date() },
				},
				select: {
					id: true,
					filingType: { select: { name: true } },
					periodEnd: true,
				},
				take: 5,
			});

			const formattedAlerts = alerts.map((filing) => ({
				message: `${filing.filingType.name} filing is overdue`,
				dueDate: filing.periodEnd.toISOString().split("T")[0],
				severity: "high",
			}));

			return {
				overallScore: complianceScore?.score || 0,
				level: complianceScore?.level || "unknown",
				monthlyTrend,
				outstandingFees: penalties._sum.amount || 0,
				pendingPayments: penalties._count.id || 0,
				alerts: formattedAlerts,
				scoreBreakdown: [
					{ category: "Documents", score: 85 },
					{ category: "Filings", score: 92 },
					{ category: "Compliance", score: 78 },
					{ category: "Payments", score: 95 },
				],
			};
		}),

	/**
	 * Get documents analytics for a client
	 * Requires: documents:view permission
	 */
	documentsAnalytics: rbacProcedure("documents", "view")
		.input(z.number())
		.use(
			cacheMiddleware({
				ttl: 300, // 5 minutes cache
				keyBuilder: (input, ctx) =>
					CacheKeys.clientDocuments(ctx.tenant?.id, input),
				tags: [CacheKeys.tags.documents, CacheKeys.tags.clients],
			}),
		)
		.query(async ({ input: clientId, ctx }) => {
			// Get total document count
			const total = await prisma.document.count({
				where: {
					clientId,
					tenantId: ctx.tenantId,
				},
			});

			// Get documents by category
			const byCategory = await prisma.$queryRaw<
				Array<{
					category: string;
					count: number;
				}>
			>`
        SELECT
          COALESCE(d."type", 'Other') as category,
          COUNT(*)::integer as count
        FROM "Document" d
        WHERE d."clientId" = ${clientId}
          AND d."tenantId" = ${ctx.tenantId}
        GROUP BY d."type"
        ORDER BY count DESC
      `;

			// Get status breakdown
			const now = new Date();
			const thirtyDaysFromNow = new Date(
				now.getTime() + 30 * 24 * 60 * 60 * 1000,
			);

			const [valid, expiringSoon, expired] = await Promise.all([
				prisma.document.count({
					where: {
						clientId,
						tenantId: ctx.tenantId,
						OR: [
							{ expiryDate: null },
							{ expiryDate: { gt: thirtyDaysFromNow } },
						],
					},
				}),
				prisma.document.count({
					where: {
						clientId,
						tenantId: ctx.tenantId,
						expiryDate: {
							gte: now,
							lte: thirtyDaysFromNow,
						},
					},
				}),
				prisma.document.count({
					where: {
						clientId,
						tenantId: ctx.tenantId,
						expiryDate: { lt: now },
					},
				}),
			]);

			// Get expiring documents
			const expiring = await prisma.document.findMany({
				where: {
					clientId,
					tenantId: ctx.tenantId,
					expiryDate: {
						gte: now,
						lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
					},
				},
				select: {
					id: true,
					name: true,
					type: true,
					expiryDate: true,
				},
				orderBy: { expiryDate: "asc" },
				take: 10,
			});

			const formattedExpiring = expiring.map((doc) => ({
				...doc,
				daysUntilExpiry: doc.expiryDate
					? Math.ceil(
							(doc.expiryDate.getTime() - now.getTime()) /
								(1000 * 60 * 60 * 24),
						)
					: 0,
			}));

			return {
				total,
				byCategory,
				statusBreakdown: {
					valid,
					expiringSoon,
					expired,
				},
				expiring: formattedExpiring,
			};
		}),

	/**
	 * Get filings analytics for a client
	 * Requires: filings:view permission
	 */
	filingsAnalytics: rbacProcedure("filings", "view")
		.input(z.number())
		.use(
			cacheMiddleware({
				ttl: 180, // 3 minutes cache
				keyBuilder: (input, ctx) =>
					CacheKeys.clientFilings(ctx.tenant?.id, input),
				tags: [CacheKeys.tags.filings, CacheKeys.tags.clients],
			}),
		)
		.query(async ({ input: clientId, ctx }) => {
			// Get total filings count
			const total = await prisma.filing.count({
				where: {
					clientId,
					tenantId: ctx.tenantId,
				},
			});

			// Get status breakdown
			const [filed, inProgress, draft, overdue] = await Promise.all([
				prisma.filing.count({
					where: { clientId, tenantId: ctx.tenantId, status: "filed" },
				}),
				prisma.filing.count({
					where: { clientId, tenantId: ctx.tenantId, status: "in_progress" },
				}),
				prisma.filing.count({
					where: { clientId, tenantId: ctx.tenantId, status: "draft" },
				}),
				prisma.filing.count({
					where: {
						clientId,
						tenantId: ctx.tenantId,
						status: { in: ["draft", "prepared"] },
						periodEnd: { lt: new Date() },
					},
				}),
			]);

			// Get upcoming filings
			const upcoming = await prisma.filing.findMany({
				where: {
					clientId,
					tenantId: ctx.tenantId,
					status: { in: ["draft", "prepared"] },
					periodEnd: { gte: new Date() },
				},
				include: {
					filingType: { select: { name: true } },
				},
				orderBy: { periodEnd: "asc" },
				take: 10,
			});

			const now = new Date();
			const formattedUpcoming = upcoming.map((filing) => ({
				id: filing.id,
				type: filing.filingType.name,
				period: filing.periodStart
					? `${filing.periodStart.toISOString().split("T")[0]} - ${filing.periodEnd.toISOString().split("T")[0]}`
					: filing.periodEnd.toISOString().split("T")[0],
				dueDate: filing.periodEnd.toISOString().split("T")[0],
				daysUntilDue: Math.ceil(
					(filing.periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
				),
				status: filing.status,
			}));

			return {
				total,
				statusBreakdown: {
					filed,
					inProgress,
					draft,
					overdue,
				},
				upcoming: formattedUpcoming,
			};
		}),

	/**
	 * Get service requests analytics for a client
	 * Requires: services:view permission
	 */
	servicesAnalytics: rbacProcedure("services", "view")
		.input(z.number())
		.use(
			cacheMiddleware({
				ttl: 300, // 5 minutes cache
				keyBuilder: (input, ctx) =>
					CacheKeys.clientServices(ctx.tenant?.id, input),
				tags: [CacheKeys.tags.services, CacheKeys.tags.clients],
			}),
		)
		.query(async ({ input: clientId, ctx }) => {
			// Get total service requests count
			const total = await prisma.serviceRequest.count({
				where: {
					clientId,
					tenantId: ctx.tenantId,
				},
			});

			// Get status breakdown
			const [completed, pending, inProgress, cancelled] = await Promise.all([
				prisma.serviceRequest.count({
					where: { clientId, tenantId: ctx.tenantId, status: "completed" },
				}),
				prisma.serviceRequest.count({
					where: { clientId, tenantId: ctx.tenantId, status: "pending" },
				}),
				prisma.serviceRequest.count({
					where: { clientId, tenantId: ctx.tenantId, status: "in_progress" },
				}),
				prisma.serviceRequest.count({
					where: { clientId, tenantId: ctx.tenantId, status: "cancelled" },
				}),
			]);

			// Get monthly stats for the last 12 months
			const monthlyStats = await prisma.$queryRaw<
				Array<{
					month: string;
					completed: number;
					pending: number;
				}>
			>`
        SELECT
          TO_CHAR(date_trunc('month', sr."createdAt"), 'YYYY-MM') as month,
          COUNT(CASE WHEN sr."status" = 'completed' THEN 1 END)::integer as completed,
          COUNT(CASE WHEN sr."status" IN ('pending', 'in_progress') THEN 1 END)::integer as pending
        FROM "ServiceRequest" sr
        WHERE sr."clientId" = ${clientId}
          AND sr."tenantId" = ${ctx.tenantId}
          AND sr."createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', sr."createdAt")
        ORDER BY month ASC
      `;

			// Get recent service requests
			const recent = await prisma.serviceRequest.findMany({
				where: {
					clientId,
					tenantId: ctx.tenantId,
				},
				select: {
					id: true,
					type: true,
					description: true,
					status: true,
					createdAt: true,
				},
				orderBy: { createdAt: "desc" },
				take: 10,
			});

			return {
				total,
				pending,
				statusBreakdown: {
					completed,
					pending,
					inProgress,
					cancelled,
				},
				monthlyStats,
				recent,
			};
		}),

	/**
	 * Get activity timeline for a client
	 * Requires: clients:view permission
	 */
	activityTimeline: rbacProcedure("clients", "view")
		.input(z.number())
		.use(
			cacheMiddleware({
				ttl: 120, // 2 minutes cache
				keyBuilder: (input, ctx) =>
					CacheKeys.clientActivity(ctx.tenant?.id, input),
				tags: [CacheKeys.tags.clients, CacheKeys.tags.activity],
			}),
		)
		.query(async ({ input: clientId, ctx }) => {
			// Get recent activities from various sources
			const [documents, filings, services, penalties] = await Promise.all([
				// Recent document activities
				prisma.document.findMany({
					where: { clientId, tenantId: ctx.tenantId },
					select: {
						name: true,
						type: true,
						createdAt: true,
						updatedAt: true,
					},
					orderBy: { createdAt: "desc" },
					take: 5,
				}),

				// Recent filing activities
				prisma.filing.findMany({
					where: { clientId, tenantId: ctx.tenantId },
					include: {
						filingType: { select: { name: true } },
					},
					orderBy: { createdAt: "desc" },
					take: 5,
				}),

				// Recent service requests
				prisma.serviceRequest.findMany({
					where: { clientId, tenantId: ctx.tenantId },
					select: {
						type: true,
						status: true,
						createdAt: true,
						updatedAt: true,
					},
					orderBy: { createdAt: "desc" },
					take: 5,
				}),

				// Recent penalties
				prisma.penalty.findMany({
					where: { clientId, tenantId: ctx.tenantId },
					select: {
						amount: true,
						reason: true,
						status: true,
						createdAt: true,
					},
					orderBy: { createdAt: "desc" },
					take: 3,
				}),
			]);

			// Combine and format activities
			const activities = [
				...documents.map((doc) => ({
					id: `doc-${doc.createdAt.getTime()}`,
					description: `Document "${doc.name}" was uploaded`,
					type: "document",
					timestamp: doc.createdAt.toISOString(),
				})),
				...filings.map((filing) => ({
					id: `filing-${filing.createdAt.getTime()}`,
					description: `${filing.filingType.name} filing was created`,
					type: "filing",
					timestamp: filing.createdAt.toISOString(),
				})),
				...services.map((service) => ({
					id: `service-${service.createdAt.getTime()}`,
					description: `Service request "${service.type}" was ${service.status}`,
					type: "service",
					timestamp: service.createdAt.toISOString(),
				})),
				...penalties.map((penalty) => ({
					id: `penalty-${penalty.createdAt.getTime()}`,
					description: `Penalty of $${penalty.amount} for ${penalty.reason}`,
					type: "penalty",
					timestamp: penalty.createdAt.toISOString(),
				})),
			].sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			);

			return {
				activities: activities.slice(0, 20),
			};
		}),
});
