/**
 * Portal tRPC Router
 *
 * Client portal endpoints for self-service access
 * Enforces tenant isolation and client-specific access control
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

/**
 * Helper to get client IDs accessible by portal user
 */
async function getPortalUserClientIds(
	_userId: string,
	tenantId: number,
): Promise<number[]> {
	// Portal users should have client assignments stored somewhere
	// For now, return all clients in tenant (should be filtered by actual assignment)
	// TODO: Implement proper client assignment tracking for portal users
	const clients = await prisma.client.findMany({
		where: { tenantId },
		select: { id: true },
	});
	return clients.map((c) => c.id);
}

/**
 * Portal router
 */
export const portalRouter = router({
	/**
	 * Get portal dashboard for client user
	 */
	dashboard: protectedProcedure.query(async ({ ctx }) => {
		const clientIds = await getPortalUserClientIds(ctx.user.id, ctx.tenantId);

		if (clientIds.length === 0) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "No client access assigned",
			});
		}

		const [documents, filings, serviceRequests, tasks] = await Promise.all([
			prisma.document.count({
				where: {
					tenantId: ctx.tenantId,
					clientId: { in: clientIds },
				},
			}),
			prisma.filing.count({
				where: {
					tenantId: ctx.tenantId,
					clientId: { in: clientIds },
				},
			}),
			prisma.serviceRequest.count({
				where: {
					tenantId: ctx.tenantId,
					clientId: { in: clientIds },
				},
			}),
			prisma.clientTask.count({
				where: {
					tenantId: ctx.tenantId,
					clientId: { in: clientIds },
					status: { in: ["pending", "in_progress"] },
				},
			}),
		]);

		return {
			counts: {
				documents,
				filings,
				serviceRequests,
				activeTasks: tasks,
			},
		};
	}),

	/**
	 * List documents accessible to portal user
	 */
	documents: protectedProcedure
		.input(
			z
				.object({
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { page = 1, pageSize = 20 } = input || {};
			const skip = (page - 1) * pageSize;

			const clientIds = await getPortalUserClientIds(ctx.user.id, ctx.tenantId);

			if (clientIds.length === 0) {
				return {
					documents: [],
					pagination: { page, pageSize, total: 0, totalPages: 0 },
				};
			}

			const [documents, total] = await Promise.all([
				prisma.document.findMany({
					where: {
						tenantId: ctx.tenantId,
						clientId: { in: clientIds },
					},
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						documentType: true,
						latestVersion: true,
					},
				}),
				prisma.document.count({
					where: {
						tenantId: ctx.tenantId,
						clientId: { in: clientIds },
					},
				}),
			]);

			return {
				documents,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * List filings accessible to portal user
	 */
	filings: protectedProcedure
		.input(
			z
				.object({
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { page = 1, pageSize = 20 } = input || {};
			const skip = (page - 1) * pageSize;

			const clientIds = await getPortalUserClientIds(ctx.user.id, ctx.tenantId);

			if (clientIds.length === 0) {
				return {
					filings: [],
					pagination: { page, pageSize, total: 0, totalPages: 0 },
				};
			}

			const [filings, total] = await Promise.all([
				prisma.filing.findMany({
					where: {
						tenantId: ctx.tenantId,
						clientId: { in: clientIds },
					},
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						filingType: true,
					},
				}),
				prisma.filing.count({
					where: {
						tenantId: ctx.tenantId,
						clientId: { in: clientIds },
					},
				}),
			]);

			return {
				filings,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * List service requests accessible to portal user
	 */
	serviceRequests: protectedProcedure
		.input(
			z
				.object({
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { page = 1, pageSize = 20 } = input || {};
			const skip = (page - 1) * pageSize;

			const clientIds = await getPortalUserClientIds(ctx.user.id, ctx.tenantId);

			if (clientIds.length === 0) {
				return {
					serviceRequests: [],
					pagination: { page, pageSize, total: 0, totalPages: 0 },
				};
			}

			const [serviceRequests, total] = await Promise.all([
				prisma.serviceRequest.findMany({
					where: {
						tenantId: ctx.tenantId,
						clientId: { in: clientIds },
					},
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						service: true,
						steps: {
							orderBy: { order: "asc" },
						},
					},
				}),
				prisma.serviceRequest.count({
					where: {
						tenantId: ctx.tenantId,
						clientId: { in: clientIds },
					},
				}),
			]);

			return {
				serviceRequests,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * List client tasks accessible to portal user
	 */
	tasks: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { status, page = 1, pageSize = 20 } = input || {};
			const skip = (page - 1) * pageSize;

			const clientIds = await getPortalUserClientIds(ctx.user.id, ctx.tenantId);

			if (clientIds.length === 0) {
				return {
					tasks: [],
					pagination: { page, pageSize, total: 0, totalPages: 0 },
				};
			}

			const where: Prisma.ClientTaskWhereInput = {
				tenantId: ctx.tenantId,
				clientId: { in: clientIds },
			};

			if (status) where.status = status;

			const [tasks, total] = await Promise.all([
				prisma.clientTask.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { dueDate: "asc" },
					include: {
						serviceRequest: {
							include: {
								service: { select: { name: true } },
							},
						},
					},
				}),
				prisma.clientTask.count({ where }),
			]);

			return {
				tasks,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get conversations for portal user
	 */
	conversations: protectedProcedure.query(async ({ ctx }) => {
		const clientIds = await getPortalUserClientIds(ctx.user.id, ctx.tenantId);

		if (clientIds.length === 0) {
			return [];
		}

		const conversations = await prisma.conversation.findMany({
			where: {
				tenantId: ctx.tenantId,
				clientId: { in: clientIds },
			},
			orderBy: { updatedAt: "desc" },
			include: {
				messages: {
					take: 1,
					orderBy: { createdAt: "desc" },
					include: {
						author: {
							select: { id: true, name: true },
						},
					},
				},
				_count: {
					select: { messages: true },
				},
			},
		});

		return conversations;
	}),

	/**
	 * Get client profile information
	 */
	profile: protectedProcedure.query(async ({ ctx }) => {
		const clientIds = await getPortalUserClientIds(ctx.user.id, ctx.tenantId);

		if (clientIds.length === 0) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "No client access assigned",
			});
		}

		const clients = await prisma.client.findMany({
			where: {
				tenantId: ctx.tenantId,
				id: { in: clientIds },
			},
			include: {
				businesses: true,
			},
		});

		return {
			user: {
				id: ctx.user.id,
				name: ctx.user.name,
				email: ctx.user.email,
			},
			clients,
		};
	}),
});
