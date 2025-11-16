/**
 * Portal tRPC Router
 *
 * Client portal endpoints for self-service access
 * Enforces tenant isolation and client-specific access control
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import type { UserRole } from "@GCMC-KAJ/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { checkRateLimit, messageRateLimiter } from "../middleware/rate-limit";

/**
 * Helper to get client IDs accessible by portal user
 */
async function getPortalUserClientIds(
	userId: string,
	tenantId: number,
	role: UserRole,
): Promise<number[]> {
	if (role !== "ClientPortalUser") {
		const clients = await prisma.client.findMany({
			where: { tenantId },
			select: { id: true },
		});

		return clients.map((client) => client.id);
	}

	const assignments = await prisma.clientPortalAccess.findMany({
		where: { tenantId, userId },
		select: { clientId: true },
	});

	return assignments.map((assignment) => assignment.clientId);
}

/**
 * Portal router
 */
export const portalRouter = router({
	/**
	 * Get portal dashboard for client user
	 */
	dashboard: protectedProcedure.query(async ({ ctx }) => {
		const clientIds = await getPortalUserClientIds(
			ctx.user.id,
			ctx.tenantId,
			ctx.role,
		);

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

			const clientIds = await getPortalUserClientIds(
				ctx.user.id,
				ctx.tenantId,
				ctx.role,
			);

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

			const clientIds = await getPortalUserClientIds(
				ctx.user.id,
				ctx.tenantId,
				ctx.role,
			);

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

			const clientIds = await getPortalUserClientIds(
				ctx.user.id,
				ctx.tenantId,
				ctx.role,
			);

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

			const clientIds = await getPortalUserClientIds(
				ctx.user.id,
				ctx.tenantId,
				ctx.role,
			);

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
		const clientIds = await getPortalUserClientIds(
			ctx.user.id,
			ctx.tenantId,
			ctx.role,
		);

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
		const clientIds = await getPortalUserClientIds(
			ctx.user.id,
			ctx.tenantId,
			ctx.role,
		);

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

	/**
	 * Get conversation details with messages
	 */
	conversationDetails: protectedProcedure
		.input(z.object({ conversationId: z.number() }))
		.query(async ({ ctx, input }) => {
			const clientIds = await getPortalUserClientIds(
				ctx.user.id,
				ctx.tenantId,
				ctx.role,
			);

			if (clientIds.length === 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "No client access assigned",
				});
			}

			const conversation = await prisma.conversation.findFirst({
				where: {
					id: input.conversationId,
					tenantId: ctx.tenantId,
					clientId: { in: clientIds },
				},
				include: {
					messages: {
						orderBy: { createdAt: "asc" },
						include: {
							author: {
								select: { id: true, name: true },
							},
						},
					},
					client: {
						select: { id: true, name: true },
					},
				},
			});

			if (!conversation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conversation not found",
				});
			}

			return conversation;
		}),

	/**
	 * Send a message in a conversation
	 * Rate limit: 20 requests per hour
	 */
	sendMessage: protectedProcedure
		.input(
			z.object({
				conversationId: z.number(),
				body: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Apply rate limiting
			await checkRateLimit(ctx.user.id, messageRateLimiter, "messaging");

			const clientIds = await getPortalUserClientIds(
				ctx.user.id,
				ctx.tenantId,
				ctx.role,
			);

			if (clientIds.length === 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "No client access assigned",
				});
			}

			// Verify the conversation belongs to this user's client
			const conversation = await prisma.conversation.findFirst({
				where: {
					id: input.conversationId,
					tenantId: ctx.tenantId,
					clientId: { in: clientIds },
				},
			});

			if (!conversation) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot send message to this conversation",
				});
			}

			const message = await prisma.message.create({
				data: {
					conversationId: input.conversationId,
					authorId: ctx.user.id,
					body: input.body,
					tenantId: ctx.tenantId,
				},
				include: {
					author: {
						select: { id: true, name: true },
					},
				},
			});

			// Update conversation updatedAt
			await prisma.conversation.update({
				where: { id: input.conversationId },
				data: { updatedAt: new Date() },
			});

			return message;
		}),

	/**
	 * Mark a task as complete
	 */
	completeTask: protectedProcedure
		.input(z.object({ taskId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const clientIds = await getPortalUserClientIds(
				ctx.user.id,
				ctx.tenantId,
				ctx.role,
			);

			if (clientIds.length === 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "No client access assigned",
				});
			}

			// Verify the task belongs to this user's client
			const task = await prisma.clientTask.findFirst({
				where: {
					id: input.taskId,
					tenantId: ctx.tenantId,
					clientId: { in: clientIds },
				},
			});

			if (!task) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot update this task",
				});
			}

			return await prisma.clientTask.update({
				where: { id: input.taskId },
				data: {
					status: "completed",
					completedAt: new Date(),
				},
			});
		}),

	/**
	 * Update user profile
	 */
	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).optional(),
				phone: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await prisma.user.update({
				where: { id: ctx.user.id },
				data: {
					name: input.name,
					phone: input.phone,
				},
			});
		}),
});
