/**
 * Tenants tRPC Router
 *
 * Handles tenant management operations
 * Most operations require SuperAdmin role
 */

import prisma from "@GCMC-KAJ/db";
import { isSuperAdmin } from "@GCMC-KAJ/rbac";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

/**
 * Tenant validation schema
 */
export const tenantSchema = z.object({
	name: z.string().min(1).max(255),
	code: z
		.string()
		.min(1)
		.max(50)
		.regex(/^[a-z0-9-]+$/, {
			message: "Code must be lowercase alphanumeric with hyphens only",
		}),
	contactInfo: z.record(z.string(), z.any()).optional(),
	settings: z.record(z.string(), z.any()).optional(),
});

/**
 * Helper to check SuperAdmin
 */
function assertSuperAdmin(ctx: any) {
	if (
		!isSuperAdmin({
			role: ctx.role,
			tenantId: ctx.tenantId,
			userId: ctx.user.id,
		})
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "This operation requires SuperAdmin privileges",
		});
	}
}

/**
 * Tenants router
 */
export const tenantsRouter = router({
	/**
	 * List all tenants (SuperAdmin only)
	 */
	list: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			assertSuperAdmin(ctx);

			const { search = "", page = 1, pageSize = 20 } = input || {};
			const skip = (page - 1) * pageSize;

			const where: any = {};

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: "insensitive" } },
					{ code: { contains: search, mode: "insensitive" } },
				];
			}

			const [tenants, total] = await Promise.all([
				prisma.tenant.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { createdAt: "desc" },
					include: {
						_count: {
							select: {
								tenantUsers: true,
								clients: true,
								documents: true,
								filings: true,
							},
						},
					},
				}),
				prisma.tenant.count({ where }),
			]);

			return {
				tenants,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get single tenant by ID
	 * SuperAdmin: can view any tenant
	 * Others: can only view their own tenant
	 */
	get: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const isSuperAdminUser = isSuperAdmin({
				role: ctx.role,
				tenantId: ctx.tenantId,
				userId: ctx.user.id,
			});

			// Non-SuperAdmins can only view their own tenant
			if (!isSuperAdminUser && input.id !== ctx.tenantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only view your own tenant",
				});
			}

			const tenant = await prisma.tenant.findUnique({
				where: { id: input.id },
				include: {
					_count: {
						select: {
							tenantUsers: true,
							clients: true,
							documents: true,
							filings: true,
							services: true,
							serviceRequests: true,
						},
					},
				},
			});

			if (!tenant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tenant not found",
				});
			}

			return tenant;
		}),

	/**
	 * Create new tenant (SuperAdmin only)
	 */
	create: protectedProcedure
		.input(tenantSchema)
		.mutation(async ({ ctx, input }) => {
			assertSuperAdmin(ctx);

			// Check if code already exists
			const existing = await prisma.tenant.findUnique({
				where: { code: input.code },
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Tenant code already exists",
				});
			}

			const tenant = await prisma.tenant.create({
				data: input,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: tenant.id,
					actorUserId: ctx.user.id,
					entityType: "tenant",
					entityId: tenant.id,
					action: "create",
					changes: { created: input },
				},
			});

			return tenant;
		}),

	/**
	 * Update tenant (SuperAdmin only, or FirmAdmin for their own tenant settings)
	 */
	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: tenantSchema.partial().omit({ code: true }), // Code cannot be changed
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const isSuperAdminUser = isSuperAdmin({
				role: ctx.role,
				tenantId: ctx.tenantId,
				userId: ctx.user.id,
			});

			// FirmAdmin can only update their own tenant
			if (!isSuperAdminUser && input.id !== ctx.tenantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only update your own tenant",
				});
			}

			// Check if tenant exists
			const existing = await prisma.tenant.findUnique({
				where: { id: input.id },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tenant not found",
				});
			}

			const updated = await prisma.tenant.update({
				where: { id: input.id },
				data: input.data,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: input.id,
					actorUserId: ctx.user.id,
					entityType: "tenant",
					entityId: input.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete tenant (SuperAdmin only)
	 */
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			assertSuperAdmin(ctx);

			// Prevent deleting your own tenant
			if (input.id === ctx.tenantId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot delete your own tenant",
				});
			}

			const existing = await prisma.tenant.findUnique({
				where: { id: input.id },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tenant not found",
				});
			}

			await prisma.tenant.delete({
				where: { id: input.id },
			});

			// Audit log (in the actor's tenant, not the deleted one)
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "tenant",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get tenant statistics (SuperAdmin only)
	 */
	stats: protectedProcedure.query(async ({ ctx }) => {
		assertSuperAdmin(ctx);

		const [totalTenants, totalUsers, totalClients, recentTenants] =
			await Promise.all([
				prisma.tenant.count(),
				prisma.tenantUser.count(),
				prisma.client.count(),
				prisma.tenant.findMany({
					take: 5,
					orderBy: { createdAt: "desc" },
					select: {
						id: true,
						name: true,
						code: true,
						createdAt: true,
					},
				}),
			]);

		return {
			totalTenants,
			totalUsers,
			totalClients,
			recentTenants,
		};
	}),

	/**
	 * Get current tenant (for non-SuperAdmins)
	 */
	current: protectedProcedure.query(async ({ ctx }) => {
		if (!ctx.tenant) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Current tenant not found",
			});
		}

		return ctx.tenant;
	}),
});
