/**
 * Document Types tRPC Router
 *
 * Handles document type management
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Document type validation schema
 */
export const documentTypeSchema = z.object({
	name: z.string().min(1).max(255),
	category: z.string().min(1).max(100),
	description: z.string().optional(),
	tags: z.array(z.string()).default([]),
	authority: z.string().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Document Types router
 */
export const documentTypesRouter = router({
	/**
	 * List document types
	 * Requires: documents:view permission
	 */
	list: rbacProcedure("documents", "view")
		.input(
			z
				.object({
					category: z.string().optional(),
					authority: z.string().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { category, authority, search = "" } = input || {};

			const where: Prisma.DocumentTypeWhereInput = { tenantId: ctx.tenantId };

			if (category) where.category = category;
			if (authority) where.authority = authority;

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: "insensitive" } },
					{ description: { contains: search, mode: "insensitive" } },
				];
			}

			const documentTypes = await prisma.documentType.findMany({
				where,
				orderBy: [{ category: "asc" }, { name: "asc" }],
				include: {
					_count: {
						select: {
							documents: true,
						},
					},
				},
			});

			return documentTypes;
		}),

	/**
	 * Get single document type by ID
	 * Requires: documents:view permission
	 */
	get: rbacProcedure("documents", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const documentType = await prisma.documentType.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					_count: {
						select: {
							documents: true,
							requirementBundleItems: true,
						},
					},
				},
			});

			if (!documentType) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document type not found",
				});
			}

			return documentType;
		}),

	/**
	 * Create document type
	 * Requires: documents:create permission (or settings:edit for admins)
	 */
	create: rbacProcedure("documents", "create")
		.input(documentTypeSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if document type with same name and category exists
			const existing = await prisma.documentType.findUnique({
				where: {
					tenantId_name_category: {
						tenantId: ctx.tenantId,
						name: input.name,
						category: input.category,
					},
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Document type with this name and category already exists",
				});
			}

			const documentType = await prisma.documentType.create({
				data: {
					...input,
					tenantId: ctx.tenantId,
					// Convert undefined to null for optional properties to satisfy exactOptionalPropertyTypes
					description: input.description || null,
					authority: input.authority || null,
					metadata: input.metadata ?? null,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "document_type",
					entityId: documentType.id,
					action: "create",
					changes: { created: input },
				},
			});

			return documentType;
		}),

	/**
	 * Update document type
	 * Requires: documents:edit permission
	 */
	update: rbacProcedure("documents", "edit")
		.input(
			z.object({
				id: z.number(),
				data: documentTypeSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.documentType.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document type not found",
				});
			}

			// Check for duplicate if name or category changed
			if (input.data.name || input.data.category) {
				const newName = input.data.name || existing.name;
				const newCategory = input.data.category || existing.category;

				if (newName !== existing.name || newCategory !== existing.category) {
					const duplicate = await prisma.documentType.findUnique({
						where: {
							tenantId_name_category: {
								tenantId: ctx.tenantId,
								name: newName,
								category: newCategory,
							},
						},
					});

					if (duplicate) {
						throw new TRPCError({
							code: "CONFLICT",
							message:
								"Document type with this name and category already exists",
						});
					}
				}
			}

			const updated = await prisma.documentType.update({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				data: {
					// Convert undefined to null for optional properties to satisfy exactOptionalPropertyTypes
					...(input.data.name !== undefined && { name: input.data.name }),
					...(input.data.category !== undefined && {
						category: input.data.category,
					}),
					...(input.data.description !== undefined && {
						description: input.data.description || null,
					}),
					...(input.data.authority !== undefined && {
						authority: input.data.authority || null,
					}),
					...(input.data.metadata !== undefined && {
						metadata: input.data.metadata ?? null,
					}),
					...(input.data.tags !== undefined && { tags: input.data.tags }),
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "document_type",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete document type
	 * Requires: documents:delete permission
	 */
	delete: rbacProcedure("documents", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.documentType.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
				include: {
					_count: {
						select: { documents: true },
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document type not found",
				});
			}

			// Prevent deletion if documents exist
			if (existing._count.documents > 0) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: `Cannot delete document type with ${existing._count.documents} associated documents`,
				});
			}

			await prisma.documentType.delete({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "document_type",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get document type categories
	 * Requires: documents:view permission
	 */
	categories: rbacProcedure("documents", "view").query(async ({ ctx }) => {
		const categories = await prisma.documentType.groupBy({
			by: ["category"],
			where: { tenantId: ctx.tenantId },
			_count: true,
		});

		return categories;
	}),

	/**
	 * Get document type authorities
	 * Requires: documents:view permission
	 */
	authorities: rbacProcedure("documents", "view").query(async ({ ctx }) => {
		const authorities = await prisma.documentType.groupBy({
			by: ["authority"],
			where: {
				tenantId: ctx.tenantId,
				authority: { not: null },
			},
			_count: true,
		});

		return authorities;
	}),
});
