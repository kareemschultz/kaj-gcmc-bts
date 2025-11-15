/**
 * Services tRPC Router
 *
 * Handles service catalog and service offerings
 * Enforces tenant isolation and RBAC permissions
 */

import prisma from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Service validation schema
 */
export const serviceSchema = z.object({
	name: z.string().min(1).max(255),
	category: z.string().min(1).max(100),
	description: z.string().optional(),
	basePrice: z.number().optional(),
	estimatedDays: z.number().int().positive().optional(),
	active: z.boolean().default(true),
});

/**
 * Services router
 */
export const servicesRouter = router({
	/**
	 * List services
	 * Requires: services:view permission
	 */
	list: rbacProcedure("services", "view")
		.input(
			z
				.object({
					category: z.string().optional(),
					active: z.boolean().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { category, active, search = "" } = input || {};

			const where: any = { tenantId: ctx.tenantId };

			if (category) where.category = category;
			if (active !== undefined) where.active = active;

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: "insensitive" } },
					{ description: { contains: search, mode: "insensitive" } },
				];
			}

			const services = await prisma.service.findMany({
				where,
				orderBy: [{ category: "asc" }, { name: "asc" }],
				include: {
					_count: {
						select: {
							serviceRequests: true,
							templates: true,
						},
					},
				},
			});

			return services;
		}),

	/**
	 * Get single service by ID
	 * Requires: services:view permission
	 */
	get: rbacProcedure("services", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const service = await prisma.service.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					templates: true,
					_count: {
						select: {
							serviceRequests: true,
						},
					},
				},
			});

			if (!service) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service not found",
				});
			}

			return service;
		}),

	/**
	 * Create service
	 * Requires: services:create permission
	 */
	create: rbacProcedure("services", "create")
		.input(serviceSchema)
		.mutation(async ({ ctx, input }) => {
			const service = await prisma.service.create({
				data: {
					...input,
					tenantId: ctx.tenantId,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "service",
					entityId: service.id,
					action: "create",
					changes: { created: input },
				},
			});

			return service;
		}),

	/**
	 * Update service
	 * Requires: services:edit permission
	 */
	update: rbacProcedure("services", "edit")
		.input(
			z.object({
				id: z.number(),
				data: serviceSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.service.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service not found",
				});
			}

			const updated = await prisma.service.update({
				where: { id: input.id },
				data: input.data,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "service",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete service
	 * Requires: services:delete permission
	 */
	delete: rbacProcedure("services", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.service.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
				include: {
					_count: {
						select: { serviceRequests: true },
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service not found",
				});
			}

			// Prevent deletion if service requests exist
			if (existing._count.serviceRequests > 0) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: `Cannot delete service with ${existing._count.serviceRequests} associated service requests`,
				});
			}

			await prisma.service.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "service",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get service categories
	 * Requires: services:view permission
	 */
	categories: rbacProcedure("services", "view").query(async ({ ctx }) => {
		const categories = await prisma.service.groupBy({
			by: ["category"],
			where: { tenantId: ctx.tenantId },
			_count: true,
		});

		return categories;
	}),

	/**
	 * Get service statistics
	 * Requires: services:view permission
	 */
	stats: rbacProcedure("services", "view").query(async ({ ctx }) => {
		const [total, active, inactive, byCategory] = await Promise.all([
			prisma.service.count({ where: { tenantId: ctx.tenantId } }),
			prisma.service.count({ where: { tenantId: ctx.tenantId, active: true } }),
			prisma.service.count({
				where: { tenantId: ctx.tenantId, active: false },
			}),
			prisma.service.groupBy({
				by: ["category"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
		]);

		return {
			total,
			active,
			inactive,
			byCategory,
		};
	}),
});
