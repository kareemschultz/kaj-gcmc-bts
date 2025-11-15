/**
 * Documents tRPC Router
 *
 * Handles document management operations
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Document validation schema
 */
export const documentSchema = z.object({
	clientId: z.number(),
	clientBusinessId: z.number().optional(),
	documentTypeId: z.number(),
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	status: z.enum(["valid", "expired", "pending_review", "rejected"]),
	authority: z.string().optional(),
	tags: z.array(z.string()).default([]),
});

/**
 * Document version validation schema
 */
export const documentVersionSchema = z.object({
	documentId: z.number(),
	fileUrl: z.string(),
	storageProvider: z.string().default("minio"),
	fileSize: z.number().optional(),
	mimeType: z.string().optional(),
	issueDate: z.string().datetime().optional(),
	expiryDate: z.string().datetime().optional(),
	issuingAuthority: z.string().optional(),
	ocrText: z.string().optional(),
	aiSummary: z.string().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Documents router
 */
export const documentsRouter = router({
	/**
	 * List documents with filtering and pagination
	 * Requires: documents:view permission
	 */
	list: rbacProcedure("documents", "view")
		.input(
			z
				.object({
					clientId: z.number().optional(),
					clientBusinessId: z.number().optional(),
					documentTypeId: z.number().optional(),
					status: z.string().optional(),
					search: z.string().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const {
				clientId,
				clientBusinessId,
				documentTypeId,
				status,
				search = "",
				page = 1,
				pageSize = 20,
			} = input || {};

			const skip = (page - 1) * pageSize;

			const where: Prisma.DocumentWhereInput = { tenantId: ctx.tenantId };

			if (clientId) where.clientId = clientId;
			if (clientBusinessId) where.clientBusinessId = clientBusinessId;
			if (documentTypeId) where.documentTypeId = documentTypeId;
			if (status) where.status = status;

			if (search) {
				where.OR = [
					{ title: { contains: search, mode: "insensitive" } },
					{ description: { contains: search, mode: "insensitive" } },
				];
			}

			const [documents, total] = await Promise.all([
				prisma.document.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						client: {
							select: {
								id: true,
								name: true,
							},
						},
						clientBusiness: {
							select: {
								id: true,
								name: true,
							},
						},
						documentType: true,
						latestVersion: true,
						_count: {
							select: {
								versions: true,
							},
						},
					},
				}),
				prisma.document.count({ where }),
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
	 * Get single document by ID
	 * Requires: documents:view permission
	 */
	get: rbacProcedure("documents", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const document = await prisma.document.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					clientBusiness: true,
					documentType: true,
					versions: {
						orderBy: { uploadedAt: "desc" },
					},
					latestVersion: true,
				},
			});

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			return document;
		}),

	/**
	 * Create new document
	 * Requires: documents:create permission
	 */
	create: rbacProcedure("documents", "create")
		.input(documentSchema)
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

			// Verify client business if provided
			if (input.clientBusinessId) {
				const business = await prisma.clientBusiness.findUnique({
					where: {
						id: input.clientBusinessId,
						tenantId: ctx.tenantId,
						clientId: input.clientId,
					},
				});

				if (!business) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client business not found",
					});
				}
			}

			// Verify document type belongs to tenant
			const docType = await prisma.documentType.findUnique({
				where: { id: input.documentTypeId, tenantId: ctx.tenantId },
			});

			if (!docType) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document type not found",
				});
			}

			const document = await prisma.document.create({
				data: {
					...input,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					documentType: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: input.clientId,
					entityType: "document",
					entityId: document.id,
					action: "create",
					changes: { created: input },
				},
			});

			return document;
		}),

	/**
	 * Update document
	 * Requires: documents:edit permission
	 */
	update: rbacProcedure("documents", "edit")
		.input(
			z.object({
				id: z.number(),
				data: documentSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.document.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			const updated = await prisma.document.update({
				where: { id: input.id },
				data: input.data,
				include: {
					client: true,
					documentType: true,
					latestVersion: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: updated.clientId,
					entityType: "document",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete document
	 * Requires: documents:delete permission
	 */
	delete: rbacProcedure("documents", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.document.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			// Delete document (cascades to versions)
			await prisma.document.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: existing.clientId,
					entityType: "document",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get expiring documents
	 * Requires: documents:view permission
	 */
	expiring: rbacProcedure("documents", "view")
		.input(
			z.object({
				days: z.number().default(30),
			}),
		)
		.query(async ({ ctx, input }) => {
			const expiryThreshold = new Date();
			expiryThreshold.setDate(expiryThreshold.getDate() + input.days);

			const documents = await prisma.document.findMany({
				where: {
					tenantId: ctx.tenantId,
					latestVersion: {
						expiryDate: {
							lte: expiryThreshold,
							gte: new Date(),
						},
					},
				},
				include: {
					client: {
						select: { id: true, name: true },
					},
					documentType: true,
					latestVersion: true,
				},
				orderBy: {
					latestVersion: {
						expiryDate: "asc",
					},
				},
			});

			return documents;
		}),

	/**
	 * Get document statistics
	 * Requires: documents:view permission
	 */
	stats: rbacProcedure("documents", "view").query(async ({ ctx }) => {
		const [total, byStatus, byType, expiringSoon] = await Promise.all([
			prisma.document.count({ where: { tenantId: ctx.tenantId } }),
			prisma.document.groupBy({
				by: ["status"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.document.groupBy({
				by: ["documentTypeId"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.document.count({
				where: {
					tenantId: ctx.tenantId,
					latestVersion: {
						expiryDate: {
							lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
							gte: new Date(),
						},
					},
				},
			}),
		]);

		return {
			total,
			byStatus,
			byType,
			expiringSoon,
		};
	}),
});
