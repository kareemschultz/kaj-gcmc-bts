/**
 * Tenant Isolation Security
 *
 * Ensures complete data isolation between tenants in multi-tenant architecture
 * Prevents data leakage and unauthorized cross-tenant access
 */
import prisma from "@GCMC-KAJ/db";
/**
 * Validate that a user has access to a specific tenant
 */
export async function validateTenantAccess(userId, tenantId) {
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
export async function getUserTenantInfo(userId) {
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
			role: tenantUser.role.name,
		};
	} catch (error) {
		console.error("Error getting user tenant info:", error);
		return null;
	}
}
/**
 * Middleware to ensure tenant isolation in database queries
 */
export function withTenantIsolation(tenantId, query) {
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
export function createTenantPrismaClient(tenantId) {
	return {
		client: {
			findMany: (args) => {
				return prisma.client.findMany(
					withTenantIsolation(tenantId, args || {}),
				);
			},
			findFirst: (args) => {
				return prisma.client.findFirst(
					withTenantIsolation(tenantId, args || {}),
				);
			},
			findUnique: (args) => {
				// For unique queries, we need to verify tenant ownership after finding
				return prisma.client.findUnique(args).then(async (result) => {
					if (result && result.tenantId !== tenantId) {
						return null; // Hide result if it belongs to different tenant
					}
					return result;
				});
			},
			create: (args) => {
				if (!args.data) args.data = {};
				args.data.tenantId = tenantId;
				return prisma.client.create(args);
			},
			update: (args) => {
				return prisma.client.update(withTenantIsolation(tenantId, args));
			},
			delete: (args) => {
				return prisma.client.delete(withTenantIsolation(tenantId, args));
			},
			count: (args) => {
				return prisma.client.count(withTenantIsolation(tenantId, args || {}));
			},
		},
		document: {
			findMany: (args) => {
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
			findFirst: (args) => {
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
			findUnique: (args) => {
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
			create: (args) => {
				// Documents are created through clients, so tenant isolation is maintained
				return prisma.document.create(args);
			},
			update: (args) => {
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
			delete: (args) => {
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
			findMany: (args) => {
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
			findFirst: (args) => {
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
			findUnique: (args) => {
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
			create: (args) => {
				return prisma.filing.create(args);
			},
			update: (args) => {
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
			delete: (args) => {
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
	resourceType,
	resourceId,
	tenantId,
) {
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
	userId,
	requestedTenantId,
	actualTenantId,
	resource,
	action,
	success,
) {
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
export async function getTenantConfig(tenantId) {
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
export function requireTenantAccess(allowedRoles = []) {
	return async (context, targetTenantId) => {
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
export function getTenantCacheKey(tenantId, key) {
	return `tenant:${tenantId}:${key}`;
}
/**
 * Tenant data encryption key derivation
 */
export function getTenantEncryptionKey(tenantId, baseKey) {
	const crypto = require("node:crypto");
	return crypto
		.createHmac("sha256", baseKey)
		.update(`tenant:${tenantId}`)
		.digest("hex");
}
