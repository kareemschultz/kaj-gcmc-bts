/**
 * Users tRPC Router
 *
 * Handles user management operations within a tenant
 * Enforces tenant isolation and RBAC permissions
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, rbacProcedure, router } from "../index";

/**
 * User validation schema
 */
export const userUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	avatarUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

/**
 * Tenant user assignment schema
 */
export const tenantUserAssignmentSchema = z.object({
	userId: z.string(),
	roleId: z.number(),
});

/**
 * Users router
 */
export const usersRouter = router({
	/**
	 * List users in current tenant
	 * Requires: users:view permission
	 */
	list: rbacProcedure("users", "view")
		.input(
			z
				.object({
					search: z.string().optional(),
					roleId: z.number().optional(),
					page: z.number().default(1),
					pageSize: z.number().default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { search = "", roleId, page = 1, pageSize = 20 } = input || {};

			const skip = (page - 1) * pageSize;

			// Build where clause for TenantUser
			const where: Prisma.TenantUserWhereInput = { tenantId: ctx.tenantId };

			if (roleId) {
				where.roleId = roleId;
			}

			if (search?.trim()) {
				const searchTerm = search.trim();
				where.user = {
					is: {
						OR: [
							{
								name: {
									contains: searchTerm,
									mode: "insensitive",
								},
							},
							{
								email: {
									contains: searchTerm,
									mode: "insensitive",
								},
							},
						],
					},
				};
			}

			// Fetch tenant users with their user and role information
			const [tenantUsers, total] = await Promise.all([
				prisma.tenantUser.findMany({
					where,
					skip,
					take: pageSize,
					include: {
						user: true,
						role: true,
					},
				}),
				prisma.tenantUser.count({ where }),
			]);

			return {
				users: tenantUsers.map((tu) => ({
					id: tu.user.id,
					name: tu.user.name,
					email: tu.user.email,
					phone: tu.user.phone,
					avatarUrl: tu.user.avatarUrl,
					emailVerified: tu.user.emailVerified,
					createdAt: tu.user.createdAt,
					updatedAt: tu.user.updatedAt,
					tenantUserId: tu.id,
					roleId: tu.roleId,
					roleName: tu.role.name,
					roleDescription: tu.role.description,
				})),
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		}),

	/**
	 * Get single user by ID
	 * Requires: users:view permission
	 */
	get: rbacProcedure("users", "view")
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Verify user is in current tenant
			const tenantUser = await prisma.tenantUser.findFirst({
				where: {
					userId: input.userId,
					tenantId: ctx.tenantId,
				},
				include: {
					user: true,
					role: {
						include: {
							permissions: true,
						},
					},
				},
			});

			if (!tenantUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this tenant",
				});
			}

			return {
				id: tenantUser.user.id,
				name: tenantUser.user.name,
				email: tenantUser.user.email,
				phone: tenantUser.user.phone,
				avatarUrl: tenantUser.user.avatarUrl,
				emailVerified: tenantUser.user.emailVerified,
				createdAt: tenantUser.user.createdAt,
				updatedAt: tenantUser.user.updatedAt,
				tenantUserId: tenantUser.id,
				roleId: tenantUser.roleId,
				role: tenantUser.role,
			};
		}),

	/**
	 * Update user profile
	 * Requires: users:edit permission
	 */
	update: rbacProcedure("users", "edit")
		.input(
			z.object({
				userId: z.string(),
				data: userUpdateSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify user is in current tenant
			const tenantUser = await prisma.tenantUser.findFirst({
				where: {
					userId: input.userId,
					tenantId: ctx.tenantId,
				},
			});

			if (!tenantUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this tenant",
				});
			}

			const updated = await prisma.user.update({
				where: { id: input.userId },
				data: input.data,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "user",
					entityId: 0, // User IDs are strings, but entityId is Int
					action: "update",
					changes: { userId: input.userId, updates: input.data },
				},
			});

			return updated;
		}),

	/**
	 * Assign user to tenant with a role
	 * Requires: users:create permission
	 */
	assignToTenant: rbacProcedure("users", "create")
		.input(tenantUserAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user exists
			const user = await prisma.user.findUnique({
				where: { id: input.userId },
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Check if role exists
			const role = await prisma.role.findUnique({
				where: { id: input.roleId },
			});

			if (!role) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Role not found",
				});
			}

			// Check if user is already assigned to this tenant
			const existing = await prisma.tenantUser.findUnique({
				where: {
					tenantId_userId: {
						tenantId: ctx.tenantId,
						userId: input.userId,
					},
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "User already assigned to this tenant",
				});
			}

			const tenantUser = await prisma.tenantUser.create({
				data: {
					tenantId: ctx.tenantId,
					userId: input.userId,
					roleId: input.roleId,
				},
				include: {
					user: true,
					role: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "tenant_user",
					entityId: tenantUser.id,
					action: "create",
					changes: { created: input },
				},
			});

			return tenantUser;
		}),

	/**
	 * Update user's role in tenant
	 * Requires: users:edit permission
	 */
	updateRole: rbacProcedure("users", "edit")
		.input(
			z.object({
				userId: z.string(),
				roleId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify user is in current tenant
			const tenantUser = await prisma.tenantUser.findFirst({
				where: {
					userId: input.userId,
					tenantId: ctx.tenantId,
				},
			});

			if (!tenantUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this tenant",
				});
			}

			// Check if role exists
			const role = await prisma.role.findUnique({
				where: { id: input.roleId },
			});

			if (!role) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Role not found",
				});
			}

			const updated = await prisma.tenantUser.update({
				where: { id: tenantUser.id },
				data: { roleId: input.roleId },
				include: {
					user: true,
					role: true,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "tenant_user",
					entityId: tenantUser.id,
					action: "update",
					changes: {
						from: { roleId: tenantUser.roleId },
						to: { roleId: input.roleId },
					},
				},
			});

			return updated;
		}),

	/**
	 * Remove user from tenant
	 * Requires: users:delete permission
	 */
	removeFromTenant: rbacProcedure("users", "delete")
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Verify user is in current tenant
			const tenantUser = await prisma.tenantUser.findFirst({
				where: {
					userId: input.userId,
					tenantId: ctx.tenantId,
				},
			});

			if (!tenantUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this tenant",
				});
			}

			// Prevent removing yourself
			if (input.userId === ctx.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot remove yourself from tenant",
				});
			}

			await prisma.tenantUser.delete({
				where: { id: tenantUser.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "tenant_user",
					entityId: tenantUser.id,
					action: "delete",
					changes: { deleted: tenantUser },
				},
			});

			return { success: true };
		}),

	/**
	 * Get current user's profile
	 * Requires: authentication only
	 */
	me: protectedProcedure.query(async ({ ctx }) => {
		// Fetch full user details from database
		const user = await prisma.user.findUnique({
			where: { id: ctx.user.id },
		});

		return {
			id: ctx.user.id,
			name: ctx.user.name,
			email: ctx.user.email,
			phone: user?.phone || null,
			avatarUrl: user?.image || null,
			emailVerified: user?.emailVerified || false,
			createdAt: user?.createdAt || new Date(),
			updatedAt: user?.updatedAt || new Date(),
			tenantId: ctx.tenantId,
			role: ctx.role,
			tenant: ctx.tenant,
		};
	}),

	/**
	 * Get user statistics
	 * Requires: users:view permission
	 */
	stats: rbacProcedure("users", "view").query(async ({ ctx }) => {
		const [total, byRole] = await Promise.all([
			prisma.tenantUser.count({ where: { tenantId: ctx.tenantId } }),
			prisma.tenantUser.groupBy({
				by: ["roleId"],
				where: { tenantId: ctx.tenantId },
				_count: true,
			}),
		]);

		// Get role names
		const roles = await prisma.role.findMany({
			where: {
				id: {
					in: byRole.map((r: { roleId: number; _count: number }) => r.roleId),
				},
			},
		});

		const byRoleWithNames = byRole.map(
			(r: { roleId: number; _count: number }) => ({
				roleId: r.roleId,
				roleName:
					roles.find(
						(role: { id: number; name: string }) => role.id === r.roleId,
					)?.name || "Unknown",
				count: r._count,
			}),
		);

		return {
			total,
			byRole: byRoleWithNames,
		};
	}),
});
