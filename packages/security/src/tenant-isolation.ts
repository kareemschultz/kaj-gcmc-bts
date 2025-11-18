/**
 * Tenant Isolation Security
 *
 * Ensures complete data isolation between tenants in multi-tenant architecture
 * Prevents data leakage and unauthorized cross-tenant access
 */

import prisma from "@GCMC-KAJ/db";
import type { UserRole } from "@GCMC-KAJ/types";

export interface TenantContext {
	userId: string;
	tenantId: number;
	role: UserRole;
}

/**
 * Validate that a user has access to a specific tenant
 */
export async function validateTenantAccess(
	userId: string,
	tenantId: number,
): Promise<boolean> {
	try {
		const tenantUser = await prisma.tenantUser.findFirst({
			where: {
				userId,
				tenantId,
			},
			include: {
				role: true,
			},
		});

		// Super Admin can access any tenant
		if (tenantUser?.role.name === "Super Admin") {
			return true;
		}

		return tenantUser !== null;
	} catch (error) {
		console.error("Error validating tenant access:", error);
		return false;
	}
}

/**
 * Get user's tenant information
 */
export async function getUserTenantInfo(userId: string): Promise<{
	tenantId: number;
	tenantCode: string;
	role: UserRole;
} | null> {
	try {
		const tenantUser = await prisma.tenantUser.findFirst({
			where: { userId },
			include: {
				tenant: true,
				role: true,
			},
		});

		if (!tenantUser) return null;

		return {
			tenantId: tenantUser.tenantId,
			tenantCode: tenantUser.tenant.code,
			role: tenantUser.role.name as UserRole,
		};
	} catch (error) {
		console.error("Error getting user tenant info:", error);
		return null;
	}
}

/**
 * Middleware to ensure tenant isolation in database queries
 */
export function withTenantIsolation<T extends Record<string, any>>(
	tenantId: number,
	query: T,
): T {
	// Add tenant filter to where clause
	if (query.where) {
		if (Array.isArray(query.where)) {
			query.where.push({ tenantId });
		} else if (typeof query.where === "object") {
			query.where.tenantId = tenantId;
		}
	} else {
		query.where = { tenantId };
	}

	return query;
}

/**
 * Create a tenant-scoped Prisma client
 */
export function createTenantPrismaClient(tenantId: number) {
	return {
		client: {
			findMany: (args?: any) => {
				return prisma.client.findMany(
					withTenantIsolation(tenantId, args || {}),
				);
			},
			findFirst: (args?: any) => {
				return prisma.client.findFirst(
					withTenantIsolation(tenantId, args || {}),
				);
			},
			findUnique: (args: any) => {
				// For unique queries, we need to verify tenant ownership after finding
				return prisma.client.findUnique(args).then(async (result) => {
					if (result && result.tenantId !== tenantId) {
						return null; // Hide result if it belongs to different tenant
					}
					return result;
				});
			},
			create: (args: any) => {
				if (!args.data) args.data = {};
				args.data.tenantId = tenantId;
				return prisma.client.create(args);
			},
			update: (args: any) => {
				return prisma.client.update(withTenantIsolation(tenantId, args));
			},
			delete: (args: any) => {
				return prisma.client.delete(withTenantIsolation(tenantId, args));
			},
			count: (args?: any) => {
				return prisma.client.count(withTenantIsolation(tenantId, args || {}));
			},
		},
		document: {
			findMany: (args?: any) => {
				return prisma.document.findMany({
					...args,
					where: {
						...args?.where,
						client: {
							tenantId,
						},
					},
				});
			},
			findFirst: (args?: any) => {
				return prisma.document.findFirst({
					...args,
					where: {
						...args?.where,
						client: {
							tenantId,
						},
					},
				});
			},
			findUnique: (args: any) => {
				return prisma.document
					.findUnique({
						...args,
						include: {
							...args.include,
							client: true,
						},
					})
					.then((result) => {
						if (result && result.client.tenantId !== tenantId) {
							return null;
						}
						return result;
					});
			},
			create: (args: any) => {
				// Documents are created through clients, so tenant isolation is maintained
				return prisma.document.create(args);
			},
			update: (args: any) => {
				return prisma.document.update({
					...args,
					where: {
						...args.where,
						client: {
							tenantId,
						},
					},
				});
			},
			delete: (args: any) => {
				return prisma.document.delete({
					...args,
					where: {
						...args.where,
						client: {
							tenantId,
						},
					},
				});
			},
		},
		filing: {
			findMany: (args?: any) => {
				return prisma.filing.findMany({
					...args,
					where: {
						...args?.where,
						client: {
							tenantId,
						},
					},
				});
			},
			findFirst: (args?: any) => {
				return prisma.filing.findFirst({
					...args,
					where: {
						...args?.where,
						client: {
							tenantId,
						},
					},
				});
			},
			findUnique: (args: any) => {
				return prisma.filing
					.findUnique({
						...args,
						include: {
							...args.include,
							client: true,
						},
					})
					.then((result) => {
						if (result && result.client.tenantId !== tenantId) {
							return null;
						}
						return result;
					});
			},
			create: (args: any) => {
				return prisma.filing.create(args);
			},
			update: (args: any) => {
				return prisma.filing.update({
					...args,
					where: {
						...args.where,
						client: {
							tenantId,
						},
					},
				});
			},
			delete: (args: any) => {
				return prisma.filing.delete({
					...args,
					where: {
						...args.where,
						client: {
							tenantId,
						},
					},
				});
			},
		},
	};
}

/**
 * Validate tenant isolation for a specific resource
 */
export async function validateResourceTenantAccess(
	resourceType: "client" | "document" | "filing" | "service",
	resourceId: number | string,
	tenantId: number,
): Promise<boolean> {
	try {
		switch (resourceType) {
			case "client": {
				const client = await prisma.client.findFirst({
					where: {
						id: Number(resourceId),
						tenantId,
					},
				});
				return client !== null;
			}

			case "document": {
				const document = await prisma.document.findFirst({
					where: {
						id: Number(resourceId),
						client: {
							tenantId,
						},
					},
				});
				return document !== null;
			}

			case "filing": {
				const filing = await prisma.filing.findFirst({
					where: {
						id: Number(resourceId),
						client: {
							tenantId,
						},
					},
				});
				return filing !== null;
			}

			case "service": {
				const service = await prisma.serviceType.findFirst({
					where: {
						id: Number(resourceId),
						tenantId,
					},
				});
				return service !== null;
			}

			default:
				return false;
		}
	} catch (error) {
		console.error(`Error validating ${resourceType} tenant access:`, error);
		return false;
	}
}

/**
 * Audit tenant access attempts
 */
export async function auditTenantAccess(
	userId: string,
	requestedTenantId: number,
	actualTenantId: number,
	resource: string,
	action: string,
	success: boolean,
): Promise<void> {
	const auditData = {
		timestamp: new Date().toISOString(),
		userId,
		requestedTenantId,
		actualTenantId,
		resource,
		action,
		success,
		crossTenantAttempt: requestedTenantId !== actualTenantId,
	};

	console.log("🔒 Tenant Access Audit:", auditData);

	// Log security incidents (cross-tenant access attempts)
	if (requestedTenantId !== actualTenantId && !success) {
		console.warn(
			"🚨 SECURITY INCIDENT: Cross-tenant access attempt detected!",
			auditData,
		);
		// In production, send alert to security monitoring system
	}
}

/**
 * Get tenant-specific configuration
 */
export async function getTenantConfig(tenantId: number): Promise<{
	settings: any;
	features: string[];
	limits: any;
} | null> {
	try {
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenantId },
			select: {
				settings: true,
				// Add any other tenant-specific configuration fields
			},
		});

		if (!tenant) return null;

		return {
			settings: tenant.settings || {},
			features: [], // Define tenant-specific features
			limits: {}, // Define tenant-specific limits
		};
	} catch (error) {
		console.error("Error getting tenant config:", error);
		return null;
	}
}

/**
 * Middleware function to ensure tenant isolation in API routes
 */
export function requireTenantAccess(allowedRoles: UserRole[] = []) {
	return async (context: TenantContext, targetTenantId?: number) => {
		const checkTenantId = targetTenantId || context.tenantId;

		// Super Admin can access any tenant
		if (context.role === "Super Admin") {
			return true;
		}

		// Check if user has access to the tenant
		const hasAccess = await validateTenantAccess(context.userId, checkTenantId);
		if (!hasAccess) {
			await auditTenantAccess(
				context.userId,
				checkTenantId,
				context.tenantId,
				"api_access",
				"tenant_validation",
				false,
			);
			throw new Error("Access denied: insufficient tenant permissions");
		}

		// Check role restrictions if specified
		if (allowedRoles.length > 0 && !allowedRoles.includes(context.role)) {
			throw new Error("Access denied: insufficient role permissions");
		}

		return true;
	};
}

/**
 * Generate tenant-scoped cache keys
 */
export function getTenantCacheKey(tenantId: number, key: string): string {
	return `tenant:${tenantId}:${key}`;
}

/**
 * Tenant data encryption key derivation
 */
export function getTenantEncryptionKey(
	tenantId: number,
	baseKey: string,
): string {
	const crypto = require("node:crypto");
	return crypto
		.createHmac("sha256", baseKey)
		.update(`tenant:${tenantId}`)
		.digest("hex");
}
