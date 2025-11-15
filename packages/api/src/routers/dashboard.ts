/**
 * Dashboard tRPC Router
 *
 * Provides dashboard data and overview statistics
 * Enforces tenant isolation and RBAC permissions
 */

import prisma from "@GCMC-KAJ/db";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Dashboard router
 */
export const dashboardRouter = router({
	/**
	 * Get main dashboard overview
	 * Requires: analytics:view permission
	 */
	overview: rbacProcedure("analytics", "view").query(async ({ ctx }) => {
		const [
			totalClients,
			totalDocuments,
			totalFilings,
			totalServiceRequests,
			expiringDocuments,
			overdueFilings,
			activeServiceRequests,
			recentClients,
			recentDocuments,
		] = await Promise.all([
			// Total counts
			prisma.client.count({ where: { tenantId: ctx.tenantId } }),
			prisma.document.count({ where: { tenantId: ctx.tenantId } }),
			prisma.filing.count({ where: { tenantId: ctx.tenantId } }),
			prisma.serviceRequest.count({ where: { tenantId: ctx.tenantId } }),

			// Alerts - Expiring documents (next 30 days)
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

			// Alerts - Overdue filings
			prisma.filing.count({
				where: {
					tenantId: ctx.tenantId,
					status: { in: ["draft", "prepared"] },
					periodEnd: { lt: new Date() },
				},
			}),

			// Active service requests
			prisma.serviceRequest.count({
				where: {
					tenantId: ctx.tenantId,
					status: { in: ["new", "in_progress", "awaiting_client"] },
				},
			}),

			// Recent activity - Clients
			prisma.client.findMany({
				where: { tenantId: ctx.tenantId },
				take: 5,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					type: true,
					createdAt: true,
				},
			}),

			// Recent activity - Documents
			prisma.document.findMany({
				where: { tenantId: ctx.tenantId },
				take: 5,
				orderBy: { createdAt: "desc" },
				include: {
					client: { select: { id: true, name: true } },
					documentType: { select: { name: true } },
				},
			}),
		]);

		return {
			counts: {
				clients: totalClients,
				documents: totalDocuments,
				filings: totalFilings,
				serviceRequests: totalServiceRequests,
			},
			alerts: {
				expiringDocuments,
				overdueFilings,
				activeServiceRequests,
			},
			recentActivity: {
				clients: recentClients,
				documents: recentDocuments,
			},
		};
	}),

	/**
	 * Get compliance overview dashboard
	 * Requires: compliance:view permission
	 */
	complianceOverview: rbacProcedure("compliance", "view").query(
		async ({ ctx }) => {
			const [
				totalScores,
				highRiskClients,
				mediumRiskClients,
				lowRiskClients,
				recentScores,
			] = await Promise.all([
				prisma.complianceScore.count({ where: { tenantId: ctx.tenantId } }),
				prisma.complianceScore.count({
					where: { tenantId: ctx.tenantId, level: "high" },
				}),
				prisma.complianceScore.count({
					where: { tenantId: ctx.tenantId, level: "medium" },
				}),
				prisma.complianceScore.count({
					where: { tenantId: ctx.tenantId, level: "low" },
				}),
				prisma.complianceScore.findMany({
					where: { tenantId: ctx.tenantId },
					take: 10,
					orderBy: { lastCalculatedAt: "desc" },
					include: {
						client: {
							select: { id: true, name: true },
						},
					},
				}),
			]);

			return {
				total: totalScores,
				byLevel: {
					high: highRiskClients,
					medium: mediumRiskClients,
					low: lowRiskClients,
				},
				recentScores,
			};
		},
	),

	/**
	 * Get task overview dashboard
	 * Requires: tasks:view permission
	 */
	taskOverview: rbacProcedure("tasks", "view").query(async ({ ctx }) => {
		const [totalTasks, openTasks, overdueTasks, myTasks, dueToday] =
			await Promise.all([
				prisma.task.count({ where: { tenantId: ctx.tenantId } }),
				prisma.task.count({
					where: {
						tenantId: ctx.tenantId,
						status: { in: ["open", "in_progress"] },
					},
				}),
				prisma.task.count({
					where: {
						tenantId: ctx.tenantId,
						status: { in: ["open", "in_progress"] },
						dueDate: { lt: new Date() },
					},
				}),
				prisma.task.count({
					where: {
						tenantId: ctx.tenantId,
						assignedToId: ctx.user.id,
						status: { in: ["open", "in_progress"] },
					},
				}),
				prisma.task.count({
					where: {
						tenantId: ctx.tenantId,
						status: { in: ["open", "in_progress"] },
						dueDate: {
							gte: new Date(new Date().setHours(0, 0, 0, 0)),
							lt: new Date(new Date().setHours(23, 59, 59, 999)),
						},
					},
				}),
			]);

		return {
			total: totalTasks,
			open: openTasks,
			overdue: overdueTasks,
			myTasks,
			dueToday,
		};
	}),

	/**
	 * Get client risk distribution
	 * Requires: clients:view permission
	 */
	clientRiskDistribution: rbacProcedure("clients", "view").query(
		async ({ ctx }) => {
			const distribution = await prisma.client.groupBy({
				by: ["riskLevel"],
				where: { tenantId: ctx.tenantId, riskLevel: { not: null } },
				_count: true,
			});

			return distribution;
		},
	),

	/**
	 * Get filing status breakdown
	 * Requires: filings:view permission
	 */
	filingStatusBreakdown: rbacProcedure("filings", "view").query(
		async ({ ctx }) => {
			const breakdown = await prisma.filing.groupBy({
				by: ["status"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			});

			return breakdown;
		},
	),

	/**
	 * Get service request pipeline
	 * Requires: services:view permission
	 */
	serviceRequestPipeline: rbacProcedure("services", "view").query(
		async ({ ctx }) => {
			const pipeline = await prisma.serviceRequest.groupBy({
				by: ["status"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			});

			return pipeline;
		},
	),

	/**
	 * Get activity timeline (last 7 days)
	 * Requires: analytics:view permission
	 */
	activityTimeline: rbacProcedure("analytics", "view")
		.input(
			z
				.object({
					days: z.number().default(7),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { days = 7 } = input || {};
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);

			const [
				newClients,
				newDocuments,
				newFilings,
				newServiceRequests,
				completedTasks,
			] = await Promise.all([
				prisma.client.count({
					where: {
						tenantId: ctx.tenantId,
						createdAt: { gte: startDate },
					},
				}),
				prisma.document.count({
					where: {
						tenantId: ctx.tenantId,
						createdAt: { gte: startDate },
					},
				}),
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						createdAt: { gte: startDate },
					},
				}),
				prisma.serviceRequest.count({
					where: {
						tenantId: ctx.tenantId,
						createdAt: { gte: startDate },
					},
				}),
				prisma.task.count({
					where: {
						tenantId: ctx.tenantId,
						status: "completed",
						updatedAt: { gte: startDate },
					},
				}),
			]);

			return {
				period: { days, startDate, endDate: new Date() },
				activity: {
					newClients,
					newDocuments,
					newFilings,
					newServiceRequests,
					completedTasks,
				},
			};
		}),
});
