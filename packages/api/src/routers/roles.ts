/**
 * Roles tRPC Router
 *
 * Handles role and permission management
 * Most operations require admin privileges
 */

import prisma from "@GCMC-KAJ/db";
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
	list: rbacProcedure("settings", "view").query(async ({ ctx }) => {
		const roles = await prisma.role.findMany({
			where: { tenantId: ctx.tenantId },
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
		.query(async ({ ctx, input }) => {
			const role = await prisma.role.findFirst({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
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
	 * Create new role (FirmAdmin or SuperAdmin)
	 */
	create: rbacProcedure("settings", "edit")
		.input(roleSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if role name already exists in this tenant
			const existing = await prisma.role.findFirst({
				where: {
					tenantId: ctx.tenantId,
					name: input.name,
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Role name already exists in this tenant",
				});
			}

			const role = await prisma.role.create({
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
					entityType: "role",
					entityId: role.id,
					action: "create",
					changes: { created: input },
				},
			});

			return role;
		}),

	/**
	 * Update role (FirmAdmin or SuperAdmin)
	 */
	update: rbacProcedure("settings", "edit")
		.input(
			z.object({
				id: z.number(),
				data: roleSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.role.findFirst({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Role not found",
				});
			}

			// Prevent renaming to existing name in this tenant
			if (input.data.name && input.data.name !== existing.name) {
				const nameExists = await prisma.role.findFirst({
					where: {
						tenantId: ctx.tenantId,
						name: input.data.name,
					},
				});

				if (nameExists) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Role name already exists in this tenant",
					});
				}
			}

			const updated = await prisma.role.update({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
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
	 * Delete role (FirmAdmin or SuperAdmin)
	 */
	delete: rbacProcedure("settings", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.role.findFirst({
				where: {
					id: input.id,
					tenantId: ctx.tenantId,
				},
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
					entityType: "role",
					entityId: input.id,
					action: "delete",
					changes: { deleted: existing },
				},
			});

			return { success: true };
		}),

	/**
	 * Add permission to role (FirmAdmin or SuperAdmin)
	 */
	addPermission: rbacProcedure("settings", "edit")
		.input(
			z.object({
				roleId: z.number(),
				permission: permissionSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if role exists and belongs to this tenant
			const role = await prisma.role.findFirst({
				where: {
					id: input.roleId,
					tenantId: ctx.tenantId,
				},
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
	 * Remove permission from role (FirmAdmin or SuperAdmin)
	 */
	removePermission: rbacProcedure("settings", "edit")
		.input(z.object({ permissionId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.permission.findUnique({
				where: { id: input.permissionId },
				include: {
					role: true,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Permission not found",
				});
			}

			// Verify the role belongs to this tenant
			if (existing.role.tenantId !== ctx.tenantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot modify permissions for roles in other tenants",
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
