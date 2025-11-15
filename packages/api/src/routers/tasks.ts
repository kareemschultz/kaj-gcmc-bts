/**
 * Tasks tRPC Router
 *
 * Handles internal task management and assignments
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, rbacProcedure, router } from "../index";

/**
 * Task validation schema
 */
export const taskSchema = z.object({
	clientId: z.number().optional(),
	serviceRequestId: z.number().optional(),
	filingId: z.number().optional(),
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	status: z.enum(["open", "in_progress", "blocked", "completed"]),
	priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
	dueDate: z.string().datetime().optional(),
	assignedToId: z.string().optional(),
});

/**
 * Tasks router
 */
export const tasksRouter = router({
	/**
	 * List tasks
	 * Requires: tasks:view permission
	 */
	list: rbacProcedure("tasks", "view")
		.input(
			z
				.object({
					clientId: z.number().optional(),
					serviceRequestId: z.number().optional(),
					filingId: z.number().optional(),
					assignedToId: z.string().optional(),
					status: z.string().optional(),
					priority: z.string().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const {
				clientId,
				serviceRequestId,
				filingId,
				assignedToId,
				status,
				priority,
				page = 1,
				pageSize = 20,
			} = input || {};

			const skip = (page - 1) * pageSize;

			const where: Prisma.TaskWhereInput = { tenantId: ctx.tenantId };

			if (clientId) where.clientId = clientId;
			if (serviceRequestId) where.serviceRequestId = serviceRequestId;
			if (filingId) where.filingId = filingId;
			if (assignedToId) where.assignedToId = assignedToId;
			if (status) where.status = status;
			if (priority) where.priority = priority;

			const [tasks, total] = await Promise.all([
				prisma.task.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: [
						{ dueDate: "asc" },
						{ priority: "desc" },
						{ createdAt: "desc" },
					],
					include: {
						client: {
							select: { id: true, name: true },
						},
						serviceRequest: {
							select: { id: true, service: { select: { name: true } } },
						},
						filing: {
							select: { id: true, filingType: { select: { name: true } } },
						},
						assignedTo: {
							select: { id: true, name: true, email: true },
						},
					},
				}),
				prisma.task.count({ where }),
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
	 * Get single task by ID
	 * Requires: tasks:view permission
	 */
	get: rbacProcedure("tasks", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const task = await prisma.task.findUnique({
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
					filing: {
						include: {
							filingType: true,
						},
					},
					assignedTo: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
				},
			});

			if (!task) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task not found",
				});
			}

			return task;
		}),

	/**
	 * Create task
	 * Requires: tasks:create permission
	 */
	create: rbacProcedure("tasks", "create")
		.input(taskSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify related entities belong to tenant if provided
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

			if (input.assignedToId) {
				const assignee = await prisma.tenantUser.findFirst({
					where: {
						userId: input.assignedToId,
						tenantId: ctx.tenantId,
					},
				});
				if (!assignee) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Assigned user not found in this tenant",
					});
				}
			}

			const task = await prisma.task.create({
				data: {
					...input,
					dueDate: input.dueDate ? new Date(input.dueDate) : null,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					assignedTo: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: input.clientId || null,
					entityType: "task",
					entityId: task.id,
					action: "create",
					changes: { created: input },
				},
			});

			return task;
		}),

	/**
	 * Update task
	 * Requires: tasks:edit permission
	 */
	update: rbacProcedure("tasks", "edit")
		.input(
			z.object({
				id: z.number(),
				data: taskSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.task.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task not found",
				});
			}

			const updated = await prisma.task.update({
				where: { id: input.id },
				data: {
					...input.data,
					dueDate: input.data.dueDate
						? new Date(input.data.dueDate)
						: undefined,
				},
				include: {
					client: true,
					assignedTo: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: updated.clientId || null,
					entityType: "task",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete task
	 * Requires: tasks:delete permission
	 */
	delete: rbacProcedure("tasks", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.task.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task not found",
				});
			}

			await prisma.task.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: existing.clientId || null,
					entityType: "task",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get my tasks (assigned to current user)
	 */
	myTasks: protectedProcedure
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

			const where: Prisma.TaskWhereInput = {
				tenantId: ctx.tenantId,
				assignedToId: ctx.user.id,
			};

			if (status) where.status = status;

			const [tasks, total] = await Promise.all([
				prisma.task.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
					include: {
						client: {
							select: { id: true, name: true },
						},
						serviceRequest: {
							select: { id: true, service: { select: { name: true } } },
						},
						filing: {
							select: { id: true, filingType: { select: { name: true } } },
						},
					},
				}),
				prisma.task.count({ where }),
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
	 * Get overdue tasks
	 * Requires: tasks:view permission
	 */
	overdue: rbacProcedure("tasks", "view").query(async ({ ctx }) => {
		const tasks = await prisma.task.findMany({
			where: {
				tenantId: ctx.tenantId,
				status: { in: ["open", "in_progress"] },
				dueDate: { lt: new Date() },
			},
			include: {
				client: {
					select: { id: true, name: true },
				},
				assignedTo: {
					select: { id: true, name: true, email: true },
				},
			},
			orderBy: { dueDate: "asc" },
		});

		return tasks;
	}),

	/**
	 * Get task statistics
	 * Requires: tasks:view permission
	 */
	stats: rbacProcedure("tasks", "view").query(async ({ ctx }) => {
		const [total, byStatus, byPriority, overdue, dueToday] = await Promise.all([
			prisma.task.count({ where: { tenantId: ctx.tenantId } }),
			prisma.task.groupBy({
				by: ["status"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.task.groupBy({
				by: ["priority"],
				where: { tenantId: ctx.tenantId, priority: { not: null } },
				_count: true,
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
					status: { in: ["open", "in_progress"] },
					dueDate: {
						gte: new Date(new Date().setHours(0, 0, 0, 0)),
						lt: new Date(new Date().setHours(23, 59, 59, 999)),
					},
				},
			}),
		]);

		return {
			total,
			byStatus,
			byPriority,
			overdue,
			dueToday,
		};
	}),
});
