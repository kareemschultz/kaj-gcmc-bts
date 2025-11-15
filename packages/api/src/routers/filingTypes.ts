/**
 * Filing Types tRPC Router
 *
 * Handles filing type management (tax types, regulatory filings)
 * Enforces tenant isolation and RBAC permissions
 */

import prisma from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Filing type validation schema
 */
export const filingTypeSchema = z.object({
	name: z.string().min(1).max(255),
	code: z.string().min(1).max(50),
	authority: z.string().min(1),
	frequency: z.enum(["monthly", "quarterly", "annual", "one_off"]),
	defaultDueDay: z.number().min(1).max(31).optional(),
	defaultDueMonth: z.number().min(1).max(12).optional(),
	description: z.string().optional(),
});

/**
 * Filing Types router
 */
export const filingTypesRouter = router({
	/**
	 * List filing types
	 * Requires: filings:view permission
	 */
	list: rbacProcedure("filings", "view")
		.input(
			z
				.object({
					authority: z.string().optional(),
					frequency: z.string().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { authority, frequency, search = "" } = input || {};

			const where: any = { tenantId: ctx.tenantId };

			if (authority) where.authority = authority;
			if (frequency) where.frequency = frequency;

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: "insensitive" } },
					{ code: { contains: search, mode: "insensitive" } },
					{ description: { contains: search, mode: "insensitive" } },
				];
			}

			const filingTypes = await prisma.filingType.findMany({
				where,
				orderBy: [{ authority: "asc" }, { name: "asc" }],
				include: {
					_count: {
						select: {
							filings: true,
							recurringFilings: true,
						},
					},
				},
			});

			return filingTypes;
		}),

	/**
	 * Get single filing type by ID
	 * Requires: filings:view permission
	 */
	get: rbacProcedure("filings", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const filingType = await prisma.filingType.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					_count: {
						select: {
							filings: true,
							recurringFilings: true,
							requirementBundleItems: true,
						},
					},
				},
			});

			if (!filingType) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing type not found",
				});
			}

			return filingType;
		}),

	/**
	 * Create filing type
	 * Requires: filings:create permission (or settings:edit for admins)
	 */
	create: rbacProcedure("filings", "create")
		.input(filingTypeSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if filing type with same code exists in tenant
			const existing = await prisma.filingType.findUnique({
				where: {
					tenantId_code: {
						tenantId: ctx.tenantId,
						code: input.code,
					},
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Filing type with this code already exists",
				});
			}

			const filingType = await prisma.filingType.create({
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
					entityType: "filing_type",
					entityId: filingType.id,
					action: "create",
					changes: { created: input },
				},
			});

			return filingType;
		}),

	/**
	 * Update filing type
	 * Requires: filings:edit permission
	 */
	update: rbacProcedure("filings", "edit")
		.input(
			z.object({
				id: z.number(),
				data: filingTypeSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.filingType.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing type not found",
				});
			}

			// Check for duplicate code if changing
			if (input.data.code && input.data.code !== existing.code) {
				const duplicate = await prisma.filingType.findUnique({
					where: {
						tenantId_code: {
							tenantId: ctx.tenantId,
							code: input.data.code,
						},
					},
				});

				if (duplicate) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Filing type with this code already exists",
					});
				}
			}

			const updated = await prisma.filingType.update({
				where: { id: input.id },
				data: input.data,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "filing_type",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete filing type
	 * Requires: filings:delete permission
	 */
	delete: rbacProcedure("filings", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.filingType.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
				include: {
					_count: {
						select: { filings: true, recurringFilings: true },
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing type not found",
				});
			}

			// Prevent deletion if filings exist
			if (existing._count.filings > 0 || existing._count.recurringFilings > 0) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: `Cannot delete filing type with ${existing._count.filings} filings and ${existing._count.recurringFilings} recurring filings`,
				});
			}

			await prisma.filingType.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "filing_type",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get filing type authorities
	 * Requires: filings:view permission
	 */
	authorities: rbacProcedure("filings", "view").query(async ({ ctx }) => {
		const authorities = await prisma.filingType.groupBy({
			by: ["authority"],
			where: { tenantId: ctx.tenantId },
			_count: true,
		});

		return authorities;
	}),

	/**
	 * Get filing types by frequency
	 * Requires: filings:view permission
	 */
	byFrequency: rbacProcedure("filings", "view")
		.input(
			z.object({
				frequency: z.enum(["monthly", "quarterly", "annual", "one_off"]),
			}),
		)
		.query(async ({ ctx, input }) => {
			const filingTypes = await prisma.filingType.findMany({
				where: {
					tenantId: ctx.tenantId,
					frequency: input.frequency,
				},
				orderBy: { name: "asc" },
			});

			return filingTypes;
		}),
});
