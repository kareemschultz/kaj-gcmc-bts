/**
 * Requirement Bundles tRPC Router
 *
 * Handles requirement bundles (GRA, NIS, DCRA, Immigration, etc.)
 * Enforces tenant isolation and RBAC permissions
 */

import prisma from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Requirement bundle validation schema
 */
export const requirementBundleSchema = z.object({
	name: z.string().min(1).max(255),
	authority: z.enum([
		"GRA",
		"NIS",
		"DCRA",
		"Immigration",
		"Deeds",
		"GO-Invest",
	]),
	category: z.string().min(1),
	description: z.string().optional(),
});

/**
 * Requirement bundle item validation schema
 */
export const bundleItemSchema = z.object({
	bundleId: z.number(),
	documentTypeId: z.number().optional(),
	filingTypeId: z.number().optional(),
	required: z.boolean().default(true),
	description: z.string().optional(),
	order: z.number().int().default(0),
});

/**
 * Requirement Bundles router
 */
export const requirementBundlesRouter = router({
	/**
	 * List requirement bundles
	 * Requires: compliance:view permission
	 */
	list: rbacProcedure("compliance", "view")
		.input(
			z
				.object({
					authority: z.string().optional(),
					category: z.string().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { authority, category, search = "" } = input || {};

			const where: any = { tenantId: ctx.tenantId };

			if (authority) where.authority = authority;
			if (category) where.category = category;

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: "insensitive" } },
					{ description: { contains: search, mode: "insensitive" } },
				];
			}

			const bundles = await prisma.requirementBundle.findMany({
				where,
				orderBy: [{ authority: "asc" }, { name: "asc" }],
				include: {
					_count: {
						select: { items: true },
					},
				},
			});

			return bundles;
		}),

	/**
	 * Get single requirement bundle by ID
	 * Requires: compliance:view permission
	 */
	get: rbacProcedure("compliance", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const bundle = await prisma.requirementBundle.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					items: {
						orderBy: { order: "asc" },
						include: {
							documentType: true,
							filingType: true,
						},
					},
				},
			});

			if (!bundle) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Requirement bundle not found",
				});
			}

			return bundle;
		}),

	/**
	 * Create requirement bundle
	 * Requires: compliance:edit permission
	 */
	create: rbacProcedure("compliance", "edit")
		.input(requirementBundleSchema)
		.mutation(async ({ ctx, input }) => {
			const bundle = await prisma.requirementBundle.create({
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
					entityType: "requirement_bundle",
					entityId: bundle.id,
					action: "create",
					changes: { created: input },
				},
			});

			return bundle;
		}),

	/**
	 * Update requirement bundle
	 * Requires: compliance:edit permission
	 */
	update: rbacProcedure("compliance", "edit")
		.input(
			z.object({
				id: z.number(),
				data: requirementBundleSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.requirementBundle.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Requirement bundle not found",
				});
			}

			const updated = await prisma.requirementBundle.update({
				where: { id: input.id },
				data: input.data,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "requirement_bundle",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete requirement bundle
	 * Requires: compliance:edit permission
	 */
	delete: rbacProcedure("compliance", "edit")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.requirementBundle.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Requirement bundle not found",
				});
			}

			await prisma.requirementBundle.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "requirement_bundle",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Add item to bundle
	 * Requires: compliance:edit permission
	 */
	addItem: rbacProcedure("compliance", "edit")
		.input(bundleItemSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify bundle belongs to tenant
			const bundle = await prisma.requirementBundle.findUnique({
				where: { id: input.bundleId, tenantId: ctx.tenantId },
			});

			if (!bundle) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Requirement bundle not found",
				});
			}

			// Must have either documentTypeId or filingTypeId
			if (!input.documentTypeId && !input.filingTypeId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Either documentTypeId or filingTypeId is required",
				});
			}

			const item = await prisma.requirementBundleItem.create({
				data: input,
				include: {
					documentType: true,
					filingType: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "requirement_bundle_item",
					entityId: item.id,
					action: "create",
					changes: { created: input },
				},
			});

			return item;
		}),

	/**
	 * Update bundle item
	 * Requires: compliance:edit permission
	 */
	updateItem: rbacProcedure("compliance", "edit")
		.input(
			z.object({
				id: z.number(),
				data: bundleItemSchema.partial().omit({ bundleId: true }),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.requirementBundleItem.findUnique({
				where: { id: input.id },
				include: { bundle: true },
			});

			if (!existing || existing.bundle.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Bundle item not found",
				});
			}

			const updated = await prisma.requirementBundleItem.update({
				where: { id: input.id },
				data: input.data,
				include: {
					documentType: true,
					filingType: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "requirement_bundle_item",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete bundle item
	 * Requires: compliance:edit permission
	 */
	deleteItem: rbacProcedure("compliance", "edit")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.requirementBundleItem.findUnique({
				where: { id: input.id },
				include: { bundle: true },
			});

			if (!existing || existing.bundle.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Bundle item not found",
				});
			}

			await prisma.requirementBundleItem.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "requirement_bundle_item",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get bundles by authority
	 * Requires: compliance:view permission
	 */
	byAuthority: rbacProcedure("compliance", "view")
		.input(
			z.object({
				authority: z.enum([
					"GRA",
					"NIS",
					"DCRA",
					"Immigration",
					"Deeds",
					"GO-Invest",
				]),
			}),
		)
		.query(async ({ ctx, input }) => {
			const bundles = await prisma.requirementBundle.findMany({
				where: {
					tenantId: ctx.tenantId,
					authority: input.authority,
				},
				orderBy: { name: "asc" },
				include: {
					items: {
						orderBy: { order: "asc" },
						include: {
							documentType: true,
							filingType: true,
						},
					},
				},
			});

			return bundles;
		}),

	/**
	 * Get bundle authorities
	 * Requires: compliance:view permission
	 */
	authorities: rbacProcedure("compliance", "view").query(async ({ ctx }) => {
		const authorities = await prisma.requirementBundle.groupBy({
			by: ["authority"],
			where: { tenantId: ctx.tenantId },
			_count: true,
		});

		return authorities;
	}),
});
