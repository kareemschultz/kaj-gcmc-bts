/**
 * Filings tRPC Router
 *
 * Handles tax and regulatory filing operations
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Filing validation schema
 */
export const filingSchema = z.object({
	clientId: z.number(),
	clientBusinessId: z.number().optional(),
	filingTypeId: z.number(),
	periodStart: z.string().datetime().optional(),
	periodEnd: z.string().datetime().optional(),
	periodLabel: z.string().optional(),
	status: z.enum([
		"draft",
		"prepared",
		"submitted",
		"approved",
		"rejected",
		"overdue",
		"archived",
	]),
	referenceNumber: z.string().optional(),
	taxAmount: z.number().optional(),
	penalties: z.number().optional(),
	interest: z.number().optional(),
	total: z.number().optional(),
	submissionDate: z.string().datetime().optional(),
	approvalDate: z.string().datetime().optional(),
	internalNotes: z.string().optional(),
	aiSummary: z.string().optional(),
});

/**
 * Filings router
 */
export const filingsRouter = router({
	/**
	 * List filings with filtering and pagination
	 * Requires: filings:view permission
	 */
	list: rbacProcedure("filings", "view")
		.input(
			z
				.object({
					clientId: z.number().optional(),
					clientBusinessId: z.number().optional(),
					filingTypeId: z.number().optional(),
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
				filingTypeId,
				status,
				search = "",
				page = 1,
				pageSize = 20,
			} = input || {};

			const skip = (page - 1) * pageSize;

			const where: Prisma.FilingWhereInput = { tenantId: ctx.tenantId };

			if (clientId) where.clientId = clientId;
			if (clientBusinessId) where.clientBusinessId = clientBusinessId;
			if (filingTypeId) where.filingTypeId = filingTypeId;
			if (status) where.status = status;

			if (search) {
				where.OR = [
					{ referenceNumber: { contains: search, mode: "insensitive" } },
					{ periodLabel: { contains: search, mode: "insensitive" } },
				];
			}

			const [filings, total] = await Promise.all([
				prisma.filing.findMany({
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
						filingType: true,
						_count: {
							select: { documents: true, tasks: true },
						},
					},
				}),
				prisma.filing.count({ where }),
			]);

			return {
				filings,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get single filing by ID
	 * Requires: filings:view permission
	 */
	get: rbacProcedure("filings", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const filing = await prisma.filing.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					clientBusiness: true,
					filingType: true,
					documents: {
						include: {
							document: {
								include: {
									documentType: true,
									latestVersion: true,
								},
							},
						},
					},
					tasks: {
						include: {
							assignedTo: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
					},
				},
			});

			if (!filing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing not found",
				});
			}

			return filing;
		}),

	/**
	 * Create new filing
	 * Requires: filings:create permission
	 */
	create: rbacProcedure("filings", "create")
		.input(filingSchema)
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

			const filing = await prisma.filing.create({
				data: {
					...input,
					periodStart: input.periodStart ? new Date(input.periodStart) : null,
					periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
					submissionDate: input.submissionDate
						? new Date(input.submissionDate)
						: null,
					approvalDate: input.approvalDate
						? new Date(input.approvalDate)
						: null,
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
					entityType: "filing",
					entityId: filing.id,
					action: "create",
					changes: { created: input },
				},
			});

			return filing;
		}),

	/**
	 * Update filing
	 * Requires: filings:edit permission
	 */
	update: rbacProcedure("filings", "edit")
		.input(
			z.object({
				id: z.number(),
				data: filingSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.filing.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing not found",
				});
			}

			const updated = await prisma.filing.update({
				where: { id: input.id },
				data: {
					...input.data,
					periodStart: input.data.periodStart
						? new Date(input.data.periodStart)
						: undefined,
					periodEnd: input.data.periodEnd
						? new Date(input.data.periodEnd)
						: undefined,
					submissionDate: input.data.submissionDate
						? new Date(input.data.submissionDate)
						: undefined,
					approvalDate: input.data.approvalDate
						? new Date(input.data.approvalDate)
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
					entityType: "filing",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete filing
	 * Requires: filings:delete permission
	 */
	delete: rbacProcedure("filings", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.filing.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing not found",
				});
			}

			await prisma.filing.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: existing.clientId,
					entityType: "filing",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get overdue filings
	 * Requires: filings:view permission
	 */
	overdue: rbacProcedure("filings", "view").query(async ({ ctx }) => {
		const filings = await prisma.filing.findMany({
			where: {
				tenantId: ctx.tenantId,
				status: { in: ["draft", "prepared"] },
				periodEnd: { lt: new Date() },
			},
			include: {
				client: {
					select: { id: true, name: true },
				},
				filingType: true,
			},
			orderBy: { periodEnd: "asc" },
		});

		return filings;
	}),

	/**
	 * Get filing statistics
	 * Requires: filings:view permission
	 */
	stats: rbacProcedure("filings", "view").query(async ({ ctx }) => {
		const [total, byStatus, byType, overdue] = await Promise.all([
			prisma.filing.count({ where: { tenantId: ctx.tenantId } }),
			prisma.filing.groupBy({
				by: ["status"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.filing.groupBy({
				by: ["filingTypeId"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
			prisma.filing.count({
				where: {
					tenantId: ctx.tenantId,
					status: { in: ["draft", "prepared"] },
					periodEnd: { lt: new Date() },
				},
			}),
		]);

		return {
			total,
			byStatus,
			byType,
			overdue,
		};
	}),

	/**
	 * Attach document to filing
	 * Requires: filings:edit permission
	 */
	attachDocument: rbacProcedure("filings", "edit")
		.input(
			z.object({
				filingId: z.number(),
				documentId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify filing and document belong to tenant
			const [filing, document] = await Promise.all([
				prisma.filing.findUnique({
					where: { id: input.filingId, tenantId: ctx.tenantId },
				}),
				prisma.document.findUnique({
					where: { id: input.documentId, tenantId: ctx.tenantId },
				}),
			]);

			if (!filing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing not found",
				});
			}

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			// Check if already attached
			const existing = await prisma.filingDocument.findUnique({
				where: {
					filingId_documentId: {
						filingId: input.filingId,
						documentId: input.documentId,
					},
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Document already attached to this filing",
				});
			}

			const filingDocument = await prisma.filingDocument.create({
				data: {
					filingId: input.filingId,
					documentId: input.documentId,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: filing.clientId,
					entityType: "filing_document",
					entityId: filingDocument.id,
					action: "create",
					changes: { created: input },
				},
			});

			return filingDocument;
		}),

	/**
	 * Detach document from filing
	 * Requires: filings:edit permission
	 */
	detachDocument: rbacProcedure("filings", "edit")
		.input(
			z.object({
				filingId: z.number(),
				documentId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify filing belongs to tenant
			const filing = await prisma.filing.findUnique({
				where: { id: input.filingId, tenantId: ctx.tenantId },
			});

			if (!filing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filing not found",
				});
			}

			const existing = await prisma.filingDocument.findUnique({
				where: {
					filingId_documentId: {
						filingId: input.filingId,
						documentId: input.documentId,
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not attached to this filing",
				});
			}

			await prisma.filingDocument.delete({
				where: {
					filingId_documentId: {
						filingId: input.filingId,
						documentId: input.documentId,
					},
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: filing.clientId,
					entityType: "filing_document",
					entityId: existing.id,
					action: "delete",
					changes: { deleted: input },
				},
			});

			return { success: true };
		}),
});
