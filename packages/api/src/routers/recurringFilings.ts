/**
 * Recurring Filings tRPC Router
 *
 * Handles recurring filing schedules and automation
 * Enforces tenant isolation and RBAC permissions
 */

import prisma from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Recurring filing validation schema
 */
export const recurringFilingSchema = z.object({
	clientId: z.number(),
	clientBusinessId: z.number().optional(),
	filingTypeId: z.number(),
	schedule: z.string().min(1),
	active: z.boolean().default(true),
	lastRunAt: z.string().datetime().optional(),
	nextRunAt: z.string().datetime().optional(),
});

/**
 * Recurring Filings router
 */
export const recurringFilingsRouter = router({
	/**
	 * List recurring filings
	 * Requires: filings:view permission
	 */
	list: rbacProcedure("filings", "view")
		.input(
			z
				.object({
					clientId: z.number().optional(),
					clientBusinessId: z.number().optional(),
					filingTypeId: z.number().optional(),
					active: z.boolean().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const {
				clientId,
				clientBusinessId,
				filingTypeId,
				active,
				page = 1,
				pageSize = 20,
			} = input || {};

			const skip = (page - 1) * pageSize;

			const where: any = { tenantId: ctx.tenantId };

			if (clientId) where.clientId = clientId;
			if (clientBusinessId) where.clientBusinessId = clientBusinessId;
			if (filingTypeId) where.filingTypeId = filingTypeId;
			if (active !== undefined) where.active = active;

			const [recurringFilings, total] = await Promise.all([
				prisma.recurringFiling.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { nextRunAt: "asc" },
					include: {
						client: {
							select: { id: true, name: true },
						},
						clientBusiness: {
							select: { id: true, name: true },
						},
						filingType: true,
					},
				}),
				prisma.recurringFiling.count({ where }),
			]);

			return {
				recurringFilings,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get single recurring filing by ID
	 * Requires: filings:view permission
	 */
	get: rbacProcedure("filings", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const recurringFiling = await prisma.recurringFiling.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					clientBusiness: true,
					filingType: true,
				},
			});

			if (!recurringFiling) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recurring filing not found",
				});
			}

			return recurringFiling;
		}),

	/**
	 * Create recurring filing
	 * Requires: filings:create permission
	 */
	create: rbacProcedure("filings", "create")
		.input(recurringFilingSchema)
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

			// Verify filing type belongs to tenant
			const filingType = await prisma.filingType.findUnique({
				where: { id: input.filingTypeId, tenantId: ctx.tenantId },
			});

			if (!filingType) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing type not found",
				});
			}

			// Check for duplicate
			const existing = await prisma.recurringFiling.findFirst({
				where: {
					tenantId: ctx.tenantId,
					clientId: input.clientId,
					clientBusinessId: input.clientBusinessId || null,
					filingTypeId: input.filingTypeId,
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Recurring filing already exists for this client and filing type",
				});
			}

			const recurringFiling = await prisma.recurringFiling.create({
				data: {
					...input,
					lastRunAt: input.lastRunAt ? new Date(input.lastRunAt) : null,
					nextRunAt: input.nextRunAt ? new Date(input.nextRunAt) : null,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					filingType: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: input.clientId,
					entityType: "recurring_filing",
					entityId: recurringFiling.id,
					action: "create",
					changes: { created: input },
				},
			});

			return recurringFiling;
		}),

	/**
	 * Update recurring filing
	 * Requires: filings:edit permission
	 */
	update: rbacProcedure("filings", "edit")
		.input(
			z.object({
				id: z.number(),
				data: recurringFilingSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.recurringFiling.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recurring filing not found",
				});
			}

			const updated = await prisma.recurringFiling.update({
				where: { id: input.id },
				data: {
					...input.data,
					lastRunAt: input.data.lastRunAt
						? new Date(input.data.lastRunAt)
						: undefined,
					nextRunAt: input.data.nextRunAt
						? new Date(input.data.nextRunAt)
						: undefined,
				},
				include: {
					client: true,
					filingType: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: updated.clientId,
					entityType: "recurring_filing",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete recurring filing
	 * Requires: filings:delete permission
	 */
	delete: rbacProcedure("filings", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.recurringFiling.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recurring filing not found",
				});
			}

			await prisma.recurringFiling.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: existing.clientId,
					entityType: "recurring_filing",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Toggle recurring filing active status
	 * Requires: filings:edit permission
	 */
	toggle: rbacProcedure("filings", "edit")
		.input(
			z.object({
				id: z.number(),
				active: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.recurringFiling.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recurring filing not found",
				});
			}

			const updated = await prisma.recurringFiling.update({
				where: { id: input.id },
				data: { active: input.active },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: updated.clientId,
					entityType: "recurring_filing",
					entityId: updated.id,
					action: "update",
					changes: {
						from: { active: existing.active },
						to: { active: input.active },
					},
				},
			});

			return updated;
		}),

	/**
	 * Get upcoming recurring filings
	 * Requires: filings:view permission
	 */
	upcoming: rbacProcedure("filings", "view")
		.input(
			z.object({
				days: z.number().default(30),
			}),
		)
		.query(async ({ ctx, input }) => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + input.days);

			const recurringFilings = await prisma.recurringFiling.findMany({
				where: {
					tenantId: ctx.tenantId,
					active: true,
					nextRunAt: {
						lte: futureDate,
						gte: new Date(),
					},
				},
				include: {
					client: {
						select: { id: true, name: true },
					},
					filingType: true,
				},
				orderBy: { nextRunAt: "asc" },
			});

			return recurringFilings;
		}),

	/**
	 * Get recurring filing statistics
	 * Requires: filings:view permission
	 */
	stats: rbacProcedure("filings", "view").query(async ({ ctx }) => {
		const [total, active, inactive, byType] = await Promise.all([
			prisma.recurringFiling.count({ where: { tenantId: ctx.tenantId } }),
			prisma.recurringFiling.count({
				where: { tenantId: ctx.tenantId, active: true },
			}),
			prisma.recurringFiling.count({
				where: { tenantId: ctx.tenantId, active: false },
			}),
			prisma.recurringFiling.groupBy({
				by: ["filingTypeId"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
		]);

		return {
			total,
			active,
			inactive,
			byType,
		};
	}),
});
