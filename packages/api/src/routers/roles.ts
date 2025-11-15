/**
 * Roles tRPC Router
 *
 * Handles role and permission management
 * Most operations require admin privileges
 */

import prisma from "@GCMC-KAJ/db";
import { isSuperAdmin } from "@GCMC-KAJ/rbac";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, rbacProcedure, router } from "../index";

/**
 * Role validation schema
 */
export const roleSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
});

/**
 * Permission validation schema
 */
export const permissionSchema = z.object({
	module: z.string().min(1),
	action: z.string().min(1),
	allowed: z.boolean().default(true),
});

/**
 * Roles router
 */
export const rolesRouter = router({
	/**
	 * List all roles
	 * Requires: settings:view permission
	 */
	list: rbacProcedure("settings", "view").query(async () => {
		const roles = await prisma.role.findMany({
			orderBy: { name: "asc" },
			include: {
				permissions: true,
				_count: {
					select: {
						tenantUsers: true,
					},
				},
			},
		});

		return roles;
	}),

	/**
	 * Get single role by ID
	 * Requires: settings:view permission
	 */
	get: rbacProcedure("settings", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const role = await prisma.role.findUnique({
				where: { id: input.id },
				include: {
					permissions: {
						orderBy: [{ module: "asc" }, { action: "asc" }],
					},
					_count: {
						select: {
							tenantUsers: true,
						},
					},
				},
			});

			if (!role) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Role not found",
				});
			}

			return role;
		}),

	/**
	 * Create new role (SuperAdmin only)
	 */
	create: protectedProcedure
		.input(roleSchema)
		.mutation(async ({ ctx, input }) => {
			// Only SuperAdmin can create roles
			if (
				!isSuperAdmin({
					role: ctx.role,
					tenantId: ctx.tenantId,
					userId: ctx.user.id,
				})
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only SuperAdmin can create roles",
				});
			}

			// Check if role name already exists
			const existing = await prisma.role.findUnique({
				where: { name: input.name },
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Role name already exists",
				});
			}

			const role = await prisma.role.create({
				data: input,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "role",
					entityId: role.id,
					action: "create",
					changes: { created: input },
				},
			});

			return role;
		}),

	/**
	 * Update role (SuperAdmin only)
	 */
	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: roleSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Only SuperAdmin can update roles
			if (
				!isSuperAdmin({
					role: ctx.role,
					tenantId: ctx.tenantId,
					userId: ctx.user.id,
				})
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only SuperAdmin can update roles",
				});
			}

			const existing = await prisma.role.findUnique({
				where: { id: input.id },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Role not found",
				});
			}

			// Prevent renaming to existing name
			if (input.data.name && input.data.name !== existing.name) {
				const nameExists = await prisma.role.findUnique({
					where: { name: input.data.name },
				});

				if (nameExists) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Role name already exists",
					});
				}
			}

			const updated = await prisma.role.update({
				where: { id: input.id },
				data: input.data,
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "role",
					entityId: input.id,
					action: "update",
					changes: { from: existing, to: updated },
				},
			});

			return updated;
		}),

	/**
	 * Delete role (SuperAdmin only)
	 */
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			// Only SuperAdmin can delete roles
			if (
				!isSuperAdmin({
					role: ctx.role,
					tenantId: ctx.tenantId,
					userId: ctx.user.id,
				})
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only SuperAdmin can delete roles",
				});
			}

			const existing = await prisma.role.findUnique({
				where: { id: input.id },
				include: {
					_count: {
						select: { tenantUsers: true },
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Role not found",
				});
			}

			// Prevent deleting role if users are assigned
			if (existing._count.tenantUsers > 0) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: `Cannot delete role with ${existing._count.tenantUsers} assigned users`,
				});
			}

			await prisma.role.delete({
				where: { id: input.id },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "role",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Add permission to role (SuperAdmin only)
	 */
	addPermission: protectedProcedure
		.input(
			z.object({
				roleId: z.number(),
				permission: permissionSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Only SuperAdmin can modify permissions
			if (
				!isSuperAdmin({
					role: ctx.role,
					tenantId: ctx.tenantId,
					userId: ctx.user.id,
				})
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only SuperAdmin can modify permissions",
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

			// Check if permission already exists
			const existing = await prisma.permission.findUnique({
				where: {
					roleId_module_action: {
						roleId: input.roleId,
						module: input.permission.module,
						action: input.permission.action,
					},
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Permission already exists for this role",
				});
			}

			const permission = await prisma.permission.create({
				data: {
					roleId: input.roleId,
					...input.permission,
				},
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "permission",
					entityId: permission.id,
					action: "create",
					changes: { created: input },
				},
			});

			return permission;
		}),

	/**
	 * Remove permission from role (SuperAdmin only)
	 */
	removePermission: protectedProcedure
		.input(z.object({ permissionId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			// Only SuperAdmin can modify permissions
			if (
				!isSuperAdmin({
					role: ctx.role,
					tenantId: ctx.tenantId,
					userId: ctx.user.id,
				})
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only SuperAdmin can modify permissions",
				});
			}

			const existing = await prisma.permission.findUnique({
				where: { id: input.permissionId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Permission not found",
				});
			}

			await prisma.permission.delete({
				where: { id: input.permissionId },
			});

			// Audit log
			await prisma.auditLog.create({
				data: {
					tenantId: ctx.tenantId,
					actorUserId: ctx.user.id,
					entityType: "permission",
					entityId: input.permissionId,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Get permissions for current user's role
	 */
	myPermissions: protectedProcedure.query(async ({ ctx }) => {
		const tenantUser = await prisma.tenantUser.findFirst({
			where: {
				userId: ctx.user.id,
				tenantId: ctx.tenantId,
			},
			include: {
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
				message: "User role not found",
			});
		}

		return tenantUser.role.permissions;
	}),
});
