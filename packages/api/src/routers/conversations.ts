/**
 * Conversations tRPC Router
 *
 * Handles messaging and conversations between users and clients
 * Enforces tenant isolation and RBAC permissions
 */

import prisma from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, rbacProcedure, router } from "../index";

/**
 * Conversation validation schema
 */
export const conversationSchema = z.object({
	clientId: z.number().optional(),
	serviceRequestId: z.number().optional(),
	subject: z.string().max(255).optional(),
});

/**
 * Message validation schema
 */
export const messageSchema = z.object({
	conversationId: z.number(),
	body: z.string().min(1),
});

/**
 * Conversations router
 */
export const conversationsRouter = router({
	/**
	 * List conversations
	 * Requires: messages:view permission
	 */
	list: rbacProcedure("messages", "view")
		.input(
			z
				.object({
					clientId: z.number().optional(),
					serviceRequestId: z.number().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { clientId, serviceRequestId, page = 1, pageSize = 20 } =
				input || {};

			const skip = (page - 1) * pageSize;

			const where: any = { tenantId: ctx.tenantId };

			if (clientId) where.clientId = clientId;
			if (serviceRequestId) where.serviceRequestId = serviceRequestId;

			const [conversations, total] = await Promise.all([
				prisma.conversation.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { updatedAt: "desc" },
					include: {
						client: {
							select: { id: true, name: true },
						},
						serviceRequest: {
							select: {
								id: true,
								service: { select: { name: true } },
							},
						},
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
				}),
				prisma.conversation.count({ where }),
			]);

			return {
				conversations,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get single conversation by ID
	 * Requires: messages:view permission
	 */
	get: rbacProcedure("messages", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const conversation = await prisma.conversation.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					serviceRequest: {
						include: {
							service: true,
						},
					},
					messages: {
						orderBy: { createdAt: "asc" },
						include: {
							author: {
								select: {
									id: true,
									name: true,
									email: true,
									avatarUrl: true,
								},
							},
						},
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
	 * Create conversation
	 * Requires: messages:create permission
	 */
	create: rbacProcedure("messages", "create")
		.input(conversationSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify related entities if provided
			if (input.clientId) {
				const client = await prisma.client.findUnique({
					where: { id: input.clientId, tenantId: ctx.tenantId },
				});
				if (!client) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client not found",
					});
				}
			}

			if (input.serviceRequestId) {
				const serviceRequest = await prisma.serviceRequest.findUnique({
					where: { id: input.serviceRequestId, tenantId: ctx.tenantId },
				});
				if (!serviceRequest) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Service request not found",
					});
				}
			}

			const conversation = await prisma.conversation.create({
				data: {
					...input,
					tenantId: ctx.tenantId,
				},
			});

			return conversation;
		}),

	/**
	 * Delete conversation
	 * Requires: messages:delete permission
	 */
	delete: rbacProcedure("messages", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.conversation.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conversation not found",
				});
			}

			await prisma.conversation.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	/**
	 * Send message in conversation
	 * Requires: messages:create permission
	 */
	sendMessage: rbacProcedure("messages", "create")
		.input(messageSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify conversation belongs to tenant
			const conversation = await prisma.conversation.findUnique({
				where: { id: input.conversationId, tenantId: ctx.tenantId },
			});

			if (!conversation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conversation not found",
				});
			}

			const message = await prisma.message.create({
				data: {
					conversationId: input.conversationId,
					authorId: ctx.user.id,
					body: input.body,
				},
				include: {
					author: {
						select: {
							id: true,
							name: true,
							email: true,
							avatarUrl: true,
						},
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
	 * Mark messages as read
	 * Requires: messages:view permission
	 */
	markAsRead: rbacProcedure("messages", "view")
		.input(
			z.object({
				messageIds: z.array(z.number()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Update all messages
			await prisma.message.updateMany({
				where: {
					id: { in: input.messageIds },
					conversation: {
						tenantId: ctx.tenantId,
					},
				},
				data: {
					readAt: new Date(),
				},
			});

			return { success: true };
		}),

	/**
	 * Get unread message count
	 */
	unreadCount: protectedProcedure.query(async ({ ctx }) => {
		const count = await prisma.message.count({
			where: {
				conversation: {
					tenantId: ctx.tenantId,
				},
				authorId: { not: ctx.user.id },
				readAt: null,
			},
		});

		return count;
	}),
});
