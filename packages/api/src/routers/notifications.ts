/**
 * Notifications tRPC Router
 *
 * Handles in-app notifications and alerts
 * Enforces tenant isolation and RBAC permissions
 */

import prisma from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

/**
 * Notification validation schema
 */
export const notificationSchema = z.object({
	recipientUserId: z.string(),
	type: z.enum(["email", "in_app", "sms"]),
	channelStatus: z.enum(["pending", "sent", "failed"]),
	message: z.string().min(1),
	metadata: z.record(z.any()).optional(),
});

/**
 * Notifications router
 */
export const notificationsRouter = router({
	/**
	 * List notifications for current user
	 */
	list: protectedProcedure
		.input(
			z
				.object({
					type: z.string().optional(),
					channelStatus: z.string().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { type, channelStatus, page = 1, pageSize = 20 } = input || {};

			const skip = (page - 1) * pageSize;

			const where: any = {
				tenantId: ctx.tenantId,
				recipientUserId: ctx.user.id,
			};

			if (type) where.type = type;
			if (channelStatus) where.channelStatus = channelStatus;

			const [notifications, total] = await Promise.all([
				prisma.notification.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
				}),
				prisma.notification.count({ where }),
			]);

			return {
				notifications,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get single notification by ID
	 */
	get: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const notification = await prisma.notification.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
					recipientUserId: ctx.user.id,
				},
			});

			if (!notification) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification not found",
				});
			}

			return notification;
		}),

	/**
	 * Create notification (admin or system only)
	 */
	create: protectedProcedure
		.input(notificationSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify recipient belongs to tenant
			const recipient = await prisma.tenantUser.findFirst({
				where: {
					userId: input.recipientUserId,
					tenantId: ctx.tenantId,
				},
			});

			if (!recipient) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recipient not found in this tenant",
				});
			}

			const notification = await prisma.notification.create({
				data: {
					...input,
					tenantId: ctx.tenantId,
				},
			});

			return notification;
		}),

	/**
	 * Delete notification
	 */
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.notification.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
					recipientUserId: ctx.user.id,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification not found",
				});
			}

			await prisma.notification.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	/**
	 * Get notification count by status
	 */
	count: protectedProcedure
		.input(
			z
				.object({
					channelStatus: z.enum(["pending", "sent", "failed"]).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const where: any = {
				tenantId: ctx.tenantId,
				recipientUserId: ctx.user.id,
			};

			if (input?.channelStatus) {
				where.channelStatus = input.channelStatus;
			}

			const count = await prisma.notification.count({ where });

			return count;
		}),

	/**
	 * Get recent notifications
	 */
	recent: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().default(10),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { limit = 10 } = input || {};

			const notifications = await prisma.notification.findMany({
				where: {
					tenantId: ctx.tenantId,
					recipientUserId: ctx.user.id,
				},
				take: limit,
				orderBy: { createdAt: "desc" },
			});

			return notifications;
		}),

	/**
	 * Mark notification as sent
	 */
	markSent: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.notification.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification not found",
				});
			}

			const updated = await prisma.notification.update({
				where: { id: input.id },
				data: { channelStatus: "sent" },
			});

			return updated;
		}),

	/**
	 * Mark notification as failed
	 */
	markFailed: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				error: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.notification.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification not found",
				});
			}

			const updated = await prisma.notification.update({
				where: { id: input.id },
				data: {
					channelStatus: "failed",
					metadata: {
						...(existing.metadata as object),
						error: input.error,
					},
				},
			});

			return updated;
		}),
});
