/**
 * Role-Based Access Control (RBAC) Guard
 *
 * Implements comprehensive RBAC with tenant isolation
 * Provides fine-grained permission checking and enforcement
 */

import prisma from "@GCMC-KAJ/db";
import type { UserRole } from "@GCMC-KAJ/types";

export interface RbacContext {
	userId: string;
	tenantId: number;
	role: UserRole;
}

export interface Permission {
	module: string;
	action: string;
	resourceId?: string | number;
}

/**
 * Permission matrix for all roles
 * This defines what each role can do within their tenant
 */
export const PERMISSION_MATRIX: Record<
	UserRole,
	{
		modules: Record<string, string[]>;
		global?: boolean;
		inherits?: UserRole[];
	}
> = {
	SuperAdmin: {
		global: true, // Can access all tenants
		modules: {
			"*": ["*"], // All actions on all modules
		},
	},
	FirmAdmin: {
		modules: {
			clients: ["view", "create", "edit", "delete"],
			documents: ["view", "create", "edit", "delete"],
			filings: ["view", "create", "edit", "delete"],
			services: ["view", "create", "edit", "delete"],
			users: ["view", "create", "edit", "delete"],
			settings: ["view", "edit"],
			analytics: ["view", "export"],
			compliance: ["view", "create", "edit"],
			tasks: ["view", "create", "edit", "delete"],
			notifications: ["view", "create", "edit", "delete"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view", "create", "export"],
		},
	},
	ComplianceManager: {
		modules: {
			clients: ["view", "create", "edit"],
			documents: ["view", "create", "edit"],
			filings: ["view", "create", "edit"],
			services: ["view", "create", "edit"],
			users: ["view"],
			settings: ["view"],
			analytics: ["view"],
			compliance: ["view", "create", "edit"],
			tasks: ["view", "create", "edit"],
			notifications: ["view", "create"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view", "create"],
		},
	},
	ComplianceOfficer: {
		modules: {
			clients: ["view", "create", "edit"],
			documents: ["view", "create", "edit"],
			filings: ["view", "create", "edit"],
			services: ["view", "create"],
			users: ["view"],
			analytics: ["view"],
			compliance: ["view", "create"],
			tasks: ["view", "create", "edit"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view"],
		},
	},
	DocumentOfficer: {
		modules: {
			clients: ["view", "create", "edit"],
			documents: ["view", "create", "edit"],
			filings: ["view", "create", "edit"],
			services: ["view"],
			analytics: ["view"],
			compliance: ["view"],
			tasks: ["view", "create", "edit"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view"],
		},
	},
	FilingClerk: {
		modules: {
			clients: ["view", "create", "edit"],
			documents: ["view", "create"],
			filings: ["view", "create"],
			services: ["view"],
			compliance: ["view"],
			tasks: ["view", "create"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view"],
		},
	},
	ClientPortalUser: {
		modules: {
			clients: ["view"],
			documents: ["view"],
			filings: ["view"],
			services: ["view"],
			tasks: ["view", "create"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
		},
	},
	Viewer: {
		modules: {
			clients: ["view"],
			documents: ["view"],
			filings: ["view"],
			services: ["view"],
			analytics: ["view"],
			compliance: ["view"],
			tasks: ["view"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
		},
	},
};

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
	context: RbacContext,
	permission: Permission,
): Promise<boolean> {
	// SuperAdmin has all permissions globally
	if (context.role === "SuperAdmin") {
		return true;
	}

	// Get role permissions from matrix
	const rolePermissions = PERMISSION_MATRIX[context.role];
	if (!rolePermissions) {
		return false;
	}

	// Check if role has global access (this should never happen for non-SuperAdmin roles)
	if (rolePermissions.global) {
		return false; // Security: only SuperAdmin should have global access, and SuperAdmin already returned true above
	}

	// Check module permissions
	const modulePermissions = rolePermissions.modules[permission.module] || [];
	const hasModuleAccess =
		modulePermissions.includes(permission.action) ||
		modulePermissions.includes("*");

	if (!hasModuleAccess) {
		// Check inherited roles if any
		if (rolePermissions.inherits) {
			for (const inheritedRole of rolePermissions.inherits) {
				const inheritedContext = { ...context, role: inheritedRole };
				if (await hasPermission(inheritedContext, permission)) {
					return true;
				}
			}
		}
		return false;
	}

	// If resource-specific permission is required, check database
	if (permission.resourceId) {
		return await hasResourcePermission(context, permission);
	}

	return true;
}

/**
 * Check resource-specific permissions (e.g., user can only edit their own records)
 */
async function hasResourcePermission(
	context: RbacContext,
	permission: Permission,
): Promise<boolean> {
	if (!permission.resourceId) return true;

	try {
		switch (permission.module) {
			case "clients": {
				const client = await prisma.client.findFirst({
					where: {
						id: Number(permission.resourceId),
						tenantId: context.tenantId, // Tenant isolation
					},
				});
				return client !== null;
			}

			case "documents": {
				const document = await prisma.document.findFirst({
					where: {
						id: Number(permission.resourceId),
						client: {
							tenantId: context.tenantId, // Tenant isolation
						},
					},
					include: { client: true },
				});
				return document !== null;
			}

			case "filings": {
				const filing = await prisma.filing.findFirst({
					where: {
						id: Number(permission.resourceId),
						client: {
							tenantId: context.tenantId, // Tenant isolation
						},
					},
					include: { client: true },
				});
				return filing !== null;
			}

			case "users": {
				// Users can edit their own profile, admins can edit tenant users
				if (permission.resourceId === context.userId) {
					return true; // Users can always edit their own profile
				}

				// Check if target user is in same tenant
				const targetUser = await prisma.tenantUser.findFirst({
					where: {
						userId: String(permission.resourceId),
						tenantId: context.tenantId,
					},
				});
				return targetUser !== null && ["FirmAdmin"].includes(context.role);
			}

			default:
				return true;
		}
	} catch (error) {
		console.error("Error checking resource permission:", error);
		return false; // Fail secure
	}
}

/**
 * Middleware function to check permissions in API routes
 */
export function requirePermission(permission: Permission) {
	return async (context: RbacContext) => {
		const allowed = await hasPermission(context, permission);
		if (!allowed) {
			throw new Error(
				`Access denied: insufficient permissions for ${permission.module}.${permission.action}`,
			);
		}
		return true;
	};
}

/**
 * Check multiple permissions (ALL must be granted)
 */
export async function hasAllPermissions(
	context: RbacContext,
	permissions: Permission[],
): Promise<boolean> {
	for (const permission of permissions) {
		if (!(await hasPermission(context, permission))) {
			return false;
		}
	}
	return true;
}

/**
 * Check multiple permissions (ANY can be granted)
 */
export async function hasAnyPermission(
	context: RbacContext,
	permissions: Permission[],
): Promise<boolean> {
	for (const permission of permissions) {
		if (await hasPermission(context, permission)) {
			return true;
		}
	}
	return false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
	const roleData = PERMISSION_MATRIX[role];
	if (!roleData) return [];

	const permissions: Permission[] = [];

	for (const [module, actions] of Object.entries(roleData.modules)) {
		for (const action of actions) {
			permissions.push({ module, action });
		}
	}

	return permissions;
}

/**
 * Ensure tenant isolation - verify user belongs to tenant
 */
export async function validateTenantAccess(
	userId: string,
	tenantId: number,
): Promise<boolean> {
	try {
		// SuperAdmin can access any tenant
		const userTenant = await prisma.tenantUser.findFirst({
			where: { userId },
			include: { role: true },
		});

		if (userTenant?.role.name === "SuperAdmin") {
			return true;
		}

		// Check if user belongs to the specific tenant
		const tenantUser = await prisma.tenantUser.findFirst({
			where: {
				userId,
				tenantId,
			},
		});

		return tenantUser !== null;
	} catch (error) {
		console.error("Error validating tenant access:", error);
		return false; // Fail secure
	}
}

/**
 * Get filtered data based on user's tenant and permissions
 */
export async function getTenantFilteredData<T>(
	context: RbacContext,
	query: () => Promise<T[]>,
): Promise<T[]> {
	try {
		// SuperAdmin sees everything
		if (context.role === "SuperAdmin") {
			return await query();
		}

		// Other users see only their tenant data
		// The query should already include tenant filtering
		return await query();
	} catch (error) {
		console.error("Error in tenant-filtered data query:", error);
		return []; // Fail secure
	}
}

/**
 * Audit log for permission checks
 */
export async function logPermissionCheck(
	context: RbacContext,
	permission: Permission,
	granted: boolean,
	resourceDetails?: Record<string, unknown>,
): Promise<void> {
	try {
		// In production, you would send this to your audit logging system
		const logEntry = {
			timestamp: new Date().toISOString(),
			userId: context.userId,
			tenantId: context.tenantId,
			role: context.role,
			module: permission.module,
			action: permission.action,
			resourceId: permission.resourceId,
			granted,
			resourceDetails,
		};

		console.log("🔒 Permission Check:", logEntry);

		// TODO: Send to audit logging service
		// await auditLogger.log('PERMISSION_CHECK', logEntry);
	} catch (error) {
		console.error("Error logging permission check:", error);
	}
}
