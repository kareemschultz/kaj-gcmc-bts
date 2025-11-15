/**
 * Service Requests tRPC Router
 *
 * Handles service request workflow management
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";
import { queueServiceRequestUpdateEmail } from "../utils/emailQueue";

/**
 * Service request validation schema
 */
export const serviceRequestSchema = z.object({
	clientId: z.number(),
	clientBusinessId: z.number().optional(),
	serviceId: z.number(),
	templateId: z.number().optional(),
	status: z.enum([
		"new",
		"in_progress",
		"awaiting_client",
		"awaiting_authority",
		"completed",
		"cancelled",
	]),
	priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
	currentStepOrder: z.number().int().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Service step validation schema
 */
export const serviceStepSchema = z.object({
	serviceRequestId: z.number(),
	filingId: z.number().optional(),
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	order: z.number().int(),
	status: z.enum(["not_started", "in_progress", "done", "blocked"]),
	dueDate: z.string().datetime().optional(),
	requiredDocTypeIds: z.array(z.number()).default([]),
	dependsOnStepId: z.number().optional(),
});

/**
 * Service Requests router
 */
export const serviceRequestsRouter = router({
	/**
	 * List service requests
	 * Requires: services:view permission
	 */
	list: rbacProcedure("services", "view")
		.input(
			z
				.object({
					clientId: z.number().optional(),
					serviceId: z.number().optional(),
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
				serviceId,
				status,
				priority,
				page = 1,
				pageSize = 20,
			} = input || {};

			const skip = (page - 1) * pageSize;

			const where: Prisma.ServiceRequestWhereInput = { tenantId: ctx.tenantId };

			if (clientId) where.clientId = clientId;
			if (serviceId) where.serviceId = serviceId;
			if (status) where.status = status;
			if (priority) where.priority = priority;

			const [serviceRequests, total] = await Promise.all([
				prisma.serviceRequest.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						client: {
							select: { id: true, name: true },
						},
						clientBusiness: {
							select: { id: true, name: true },
						},
						service: true,
						_count: {
							select: {
								steps: true,
								tasks: true,
								conversations: true,
							},
						},
					},
				}),
				prisma.serviceRequest.count({ where }),
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
	 * Get single service request by ID
	 * Requires: services:view permission
	 */
	get: rbacProcedure("services", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const serviceRequest = await prisma.serviceRequest.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					clientBusiness: true,
					service: true,
					template: true,
					steps: {
						orderBy: { order: "asc" },
						include: {
							filing: true,
						},
					},
					tasks: {
						include: {
							assignedTo: {
								select: { id: true, name: true, email: true },
							},
						},
					},
					conversations: {
						include: {
							messages: {
								take: 5,
								orderBy: { createdAt: "desc" },
								include: {
									author: {
										select: { id: true, name: true },
									},
								},
							},
						},
					},
				},
			});

			if (!serviceRequest) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service request not found",
				});
			}

			return serviceRequest;
		}),

	/**
	 * Create service request
	 * Requires: services:create permission
	 */
	create: rbacProcedure("services", "create")
		.input(serviceRequestSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify client belongs to tenant
			const client = await prisma.client.findUnique({
				where: { id: input.clientId, tenantId: ctx.tenantId },
			});

			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			// Verify service belongs to tenant
			const service = await prisma.service.findUnique({
				where: { id: input.serviceId, tenantId: ctx.tenantId },
			});

			if (!service) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service not found",
				});
			}

			const serviceRequest = await prisma.serviceRequest.create({
				data: {
					...input,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					service: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: input.clientId,
					entityType: "service_request",
					entityId: serviceRequest.id,
					action: "create",
					changes: { created: input },
				},
			});

			return serviceRequest;
		}),

	/**
	 * Update service request
	 * Requires: services:edit permission
	 */
	update: rbacProcedure("services", "edit")
		.input(
			z.object({
				id: z.number(),
				data: serviceRequestSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.serviceRequest.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
				include: {
					client: true,
					service: true,
					steps: {
						where: { status: "in_progress" },
						orderBy: { order: "asc" },
						take: 1,
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service request not found",
				});
			}

			const updated = await prisma.serviceRequest.update({
				where: { id: input.id },
				data: input.data,
				include: {
					client: true,
					service: true,
					tenant: true,
					steps: {
						where: { status: "in_progress" },
						orderBy: { order: "asc" },
						take: 1,
					},
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: updated.clientId,
					entityType: "service_request",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			// Send email if status changed and client has email
			const statusChanged = existing.status !== updated.status;
			if (statusChanged && updated.client.email) {
				try {
					await queueServiceRequestUpdateEmail(updated.client.email, {
						recipientName: updated.client.name,
						serviceName: updated.service.name,
						clientName: updated.client.name,
						previousStatus: existing.status,
						newStatus: updated.status,
						updatedBy: ctx.user.name,
						currentStep: updated.steps[0]?.title,
						portalUrl: process.env.PORTAL_URL || "https://portal.gcmc.com",
						tenantName: updated.tenant.name,
					});
				} catch (error) {
					console.error("Failed to queue service request update email:", error);
					// Don't fail the request if email fails
				}
			}

			return updated;
		}),

	/**
	 * Delete service request
	 * Requires: services:delete permission
	 */
	delete: rbacProcedure("services", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.serviceRequest.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service request not found",
				});
			}

			await prisma.serviceRequest.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: existing.clientId,
					entityType: "service_request",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Create service step
	 * Requires: services:edit permission
	 */
	createStep: rbacProcedure("services", "edit")
		.input(serviceStepSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify service request belongs to tenant
			const serviceRequest = await prisma.serviceRequest.findUnique({
				where: { id: input.serviceRequestId, tenantId: ctx.tenantId },
			});

			if (!serviceRequest) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service request not found",
				});
			}

			const step = await prisma.serviceStep.create({
				data: {
					...input,
					dueDate: input.dueDate ? new Date(input.dueDate) : null,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: serviceRequest.clientId,
					entityType: "service_step",
					entityId: step.id,
					action: "create",
					changes: { created: input },
				},
			});

			return step;
		}),

	/**
	 * Update service step
	 * Requires: services:edit permission
	 */
	updateStep: rbacProcedure("services", "edit")
		.input(
			z.object({
				id: z.number(),
				data: serviceStepSchema.partial().omit({ serviceRequestId: true }),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.serviceStep.findUnique({
				where: { id: input.id },
				include: { serviceRequest: true },
			});

			if (!existing || existing.serviceRequest.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service step not found",
				});
			}

			const updated = await prisma.serviceStep.update({
				where: { id: input.id },
				data: {
					...input.data,
					dueDate: input.data.dueDate
						? new Date(input.data.dueDate)
						: undefined,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: existing.serviceRequest.clientId,
					entityType: "service_step",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete service step
	 * Requires: services:edit permission
	 */
	deleteStep: rbacProcedure("services", "edit")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.serviceStep.findUnique({
				where: { id: input.id },
				include: { serviceRequest: true },
			});

			if (!existing || existing.serviceRequest.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service step not found",
				});
			}

			await prisma.serviceStep.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: existing.serviceRequest.clientId,
					entityType: "service_step",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get service request statistics
	 * Requires: services:view permission
	 */
	stats: rbacProcedure("services", "view").query(async ({ ctx }) => {
		const [total, byStatus, byService, byPriority] = await Promise.all([
			prisma.serviceRequest.count({ where: { tenantId: ctx.tenantId } }),
			prisma.serviceRequest.groupBy({
				by: ["status"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.serviceRequest.groupBy({
				by: ["serviceId"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.serviceRequest.groupBy({
				by: ["priority"],
				where: { tenantId: ctx.tenantId, priority: { not: null } },
				_count: true,
			}),
		]);

		return {
			total,
			byStatus,
			byService,
			byPriority,
		};
	}),
});
