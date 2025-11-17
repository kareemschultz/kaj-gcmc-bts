/**
 * Client Businesses tRPC Router
 *
 * Handles client business entity management
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Client business validation schema
 */
export const clientBusinessSchema = z.object({
	clientId: z.number(),
	name: z.string().min(1).max(255),
	registrationNumber: z.string().optional(),
	registrationType: z.string().optional(),
	incorporationDate: z.string().datetime().optional(),
	country: z.string().optional(),
	sector: z.string().optional(),
	status: z.string().optional(),
});

/**
 * Client Businesses router
 */
export const clientBusinessesRouter = router({
	/**
	 * List client businesses
	 * Requires: clients:view permission
	 */
	list: rbacProcedure("clients", "view")
		.input(
			z
				.object({
					clientId: z.number().optional(),
					sector: z.string().optional(),
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
				sector,
				status,
				search = "",
				page = 1,
				pageSize = 20,
			} = input || {};

			const skip = (page - 1) * pageSize;

			const where: Prisma.ClientBusinessWhereInput = { tenantId: ctx.tenantId };

			if (clientId) where.clientId = clientId;
			if (sector) where.sector = sector;
			if (status) where.status = status;

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: "insensitive" } },
					{ registrationNumber: { contains: search, mode: "insensitive" } },
				];
			}

			const [businesses, total] = await Promise.all([
				prisma.clientBusiness.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						client: {
							select: { id: true, name: true },
						},
						_count: {
							select: {
								documents: true,
								filings: true,
								serviceRequests: true,
							},
						},
					},
				}),
				prisma.clientBusiness.count({ where }),
			]);

			return {
				businesses,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get single client business by ID
	 * Requires: clients:view permission
	 */
	get: rbacProcedure("clients", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const business = await prisma.clientBusiness.findUnique({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				include: {
					client: true,
					_count: {
						select: {
							documents: true,
							filings: true,
							serviceRequests: true,
							recurringFilings: true,
						},
					},
				},
			});

			if (!business) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client business not found",
				});
			}

			return business;
		}),

	/**
	 * Create client business
	 * Requires: clients:create permission
	 */
	create: rbacProcedure("clients", "create")
		.input(clientBusinessSchema)
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

			const business = await prisma.clientBusiness.create({
				data: {
					...input,
					incorporationDate: input.incorporationDate
						? new Date(input.incorporationDate)
						: null,
					tenantId: ctx.tenantId,
					// Convert undefined to null for optional properties to satisfy exactOptionalPropertyTypes
					registrationNumber: input.registrationNumber || null,
					registrationType: input.registrationType || null,
					country: input.country || null,
					sector: input.sector || null,
					status: input.status || null,
				},
				include: {
					client: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: input.clientId,
					entityType: "client_business",
					entityId: business.id,
					action: "create",
					changes: { created: input },
				},
			});

			return business;
		}),

	/**
	 * Update client business
	 * Requires: clients:edit permission
	 */
	update: rbacProcedure("clients", "edit")
		.input(
			z.object({
				id: z.number(),
				data: clientBusinessSchema.partial().omit({ clientId: true }),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.clientBusiness.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client business not found",
				});
			}

			const updated = await prisma.clientBusiness.update({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
				data: {
					// Convert undefined to null for optional properties to satisfy exactOptionalPropertyTypes
					...(input.data.name !== undefined && { name: input.data.name }),
					...(input.data.registrationNumber !== undefined && {
						registrationNumber: input.data.registrationNumber || null,
					}),
					...(input.data.registrationType !== undefined && {
						registrationType: input.data.registrationType || null,
					}),
					...(input.data.incorporationDate !== undefined && {
						incorporationDate: input.data.incorporationDate
							? new Date(input.data.incorporationDate)
							: null,
					}),
					...(input.data.country !== undefined && {
						country: input.data.country || null,
					}),
					...(input.data.sector !== undefined && {
						sector: input.data.sector || null,
					}),
					...(input.data.status !== undefined && {
						status: input.data.status || null,
					}),
				},
				include: {
					client: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					clientId: updated.clientId,
					entityType: "client_business",
					entityId: updated.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete client business
	 * Requires: clients:delete permission
	 */
	delete: rbacProcedure("clients", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.clientBusiness.findUnique({
				where: { id: input.id, tenantId: ctx.tenantId },
				include: {
					_count: {
						select: { documents: true, filings: true, serviceRequests: true },
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client business not found",
				});
			}

			// Warn if there are associated records
			const hasRecords =
				existing._count.documents > 0 ||
				existing._count.filings > 0 ||
				existing._count.serviceRequests > 0;

			if (hasRecords) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: `Cannot delete client business with ${existing._count.documents} documents, ${existing._count.filings} filings, and ${existing._count.serviceRequests} service requests`,
				});
			}

			await prisma.clientBusiness.delete({
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
					clientId: existing.clientId,
					entityType: "client_business",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get businesses by client
	 * Requires: clients:view permission
	 */
	byClient: rbacProcedure("clients", "view")
		.input(z.object({ clientId: z.number() }))
		.query(async ({ ctx, input }) => {
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

			const businesses = await prisma.clientBusiness.findMany({
				where: {
					clientId: input.clientId,
					tenantId: ctx.tenantId,
				},
				orderBy: { name: "asc" },
				include: {
					_count: {
						select: {
							documents: true,
							filings: true,
							serviceRequests: true,
						},
					},
				},
			});

			return businesses;
		}),

	/**
	 * Get client business statistics
	 * Requires: clients:view permission
	 */
	stats: rbacProcedure("clients", "view").query(async ({ ctx }) => {
		const [total, bySector, byStatus] = await Promise.all([
			prisma.clientBusiness.count({ where: { tenantId: ctx.tenantId } }),
			prisma.clientBusiness.groupBy({
				by: ["sector"],
				where: { tenantId: ctx.tenantId, sector: { not: null } },
				_count: true,
			}),
			prisma.clientBusiness.groupBy({
				by: ["status"],
				where: { tenantId: ctx.tenantId, status: { not: null } },
				_count: true,
			}),
		]);

		return {
			total,
			bySector,
			byStatus,
		};
	}),
});
