/**
 * API Security Middleware and Guards
 *
 * Comprehensive API security layer for tRPC endpoints
 * Implements input validation, rate limiting, and security controls
 */

import { type Context } from "@GCMC-KAJ/api/context";
import type { UserRole } from "@GCMC-KAJ/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { SecureSchemas } from "./input-validation";
import { hasPermission, type RbacContext } from "./rbac-guard";

/**
 * Security context for API requests
 */
export interface ApiSecurityContext extends Context {
	tenantId: number;
	role: UserRole;
}

/**
 * Create authenticated context with security validation
 */
export function createSecureContext(context: Context): ApiSecurityContext {
	if (!context.user || !context.tenantId || !context.role) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}

	return {
		...context,
		tenantId: context.tenantId,
		role: context.role,
	};
}

/**
 * Require authentication for tRPC procedures
 */
export function requireAuth() {
	return async (context: Context) => {
		if (!context.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		if (!context.tenantId || !context.role) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "User not assigned to any tenant",
			});
		}

		return createSecureContext(context);
	};
}

/**
 * Require specific role for tRPC procedures
 */
export function requireRole(allowedRoles: string[]) {
	return async (context: Context) => {
		const secureContext = await requireAuth()(context);

		if (!allowedRoles.includes(secureContext.role)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
			});
		}

		return secureContext;
	};
}

/**
 * Require specific permission for tRPC procedures
 */
export function requirePermission(module: string, action: string) {
	return async (context: Context, resourceId?: string | number) => {
		const secureContext = await requireAuth()(context);

		const userId = secureContext.user?.id;
		if (!userId) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "User ID is required",
			});
		}

		const rbacContext: RbacContext = {
			userId,
			tenantId: secureContext.tenantId,
			role: secureContext.role,
		};

		const permission = {
			module,
			action,
			...(resourceId !== undefined && { resourceId }),
		};

		const allowed = await hasPermission(rbacContext, permission);

		if (!allowed) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `Access denied: insufficient permissions for ${module}.${action}`,
			});
		}

		return secureContext;
	};
}

/**
 * Validate tenant access for resources
 */
export function requireTenantResource(
	resourceType: "client" | "document" | "filing" | "service",
) {
	return async (context: Context, resourceId: number) => {
		const secureContext = await requireAuth()(context);

		const hasAccess = await validateResourceTenantAccess(
			resourceType,
			resourceId,
			secureContext.tenantId,
		);

		if (!hasAccess) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Resource not found or access denied",
			});
		}

		return secureContext;
	};
}

/**
 * Input validation schemas for API endpoints
 */
export const ApiSchemas = {
	// Pagination
	pagination: z.object({
		page: z.number().min(1).max(1000).default(1),
		limit: z.number().min(1).max(100).default(20),
		orderBy: z
			.string()
			.regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
			.optional(),
		orderDir: z.enum(["asc", "desc"]).default("desc"),
	}),

	// Search and filtering
	search: z.object({
		query: SecureSchemas.safeText.optional(),
		filters: z.record(z.string(), z.any()).optional(),
	}),

	// Client operations
	createClient: z.object({
		name: SecureSchemas.businessName,
		email: SecureSchemas.email.optional(),
		phone: SecureSchemas.phoneNumber.optional(),
		address: z
			.object({
				street: SecureSchemas.safeText,
				city: SecureSchemas.safeText,
				state: SecureSchemas.safeText,
				postalCode: SecureSchemas.postalCode,
				country: SecureSchemas.safeText.default("US"),
			})
			.optional(),
		taxId: z
			.string()
			.regex(/^[0-9-]+$/)
			.optional(),
		incorporationDate: z.string().datetime().optional(),
		businessType: z
			.enum(["Corporation", "LLC", "Partnership", "Sole Proprietorship"])
			.optional(),
	}),

	updateClient: z.object({
		id: z.number().positive(),
		name: SecureSchemas.businessName.optional(),
		email: SecureSchemas.email.optional(),
		phone: SecureSchemas.phoneNumber.optional(),
		address: z
			.object({
				street: SecureSchemas.safeText,
				city: SecureSchemas.safeText,
				state: SecureSchemas.safeText,
				postalCode: SecureSchemas.postalCode,
				country: SecureSchemas.safeText,
			})
			.optional(),
		taxId: z
			.string()
			.regex(/^[0-9-]+$/)
			.optional(),
		incorporationDate: z.string().datetime().optional(),
		businessType: z
			.enum(["Corporation", "LLC", "Partnership", "Sole Proprietorship"])
			.optional(),
	}),

	// Document operations
	createDocument: z.object({
		clientId: z.number().positive(),
		name: SecureSchemas.fileName,
		type: z.string().min(1).max(50),
		description: SecureSchemas.safeText.optional(),
		filePath: z.string().min(1).max(500),
		fileSize: z
			.number()
			.positive()
			.max(100 * 1024 * 1024), // 100MB max
		mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-+]+$/i),
	}),

	// Filing operations
	createFiling: z.object({
		clientId: z.number().positive(),
		filingTypeId: z.number().positive(),
		dueDate: z.string().datetime(),
		status: z
			.enum(["Pending", "In Progress", "Completed", "Overdue"])
			.default("Pending"),
		priority: z.enum(["Low", "Normal", "High", "Critical"]).default("Normal"),
		notes: SecureSchemas.safeText.optional(),
	}),

	// User operations
	updateUser: z.object({
		id: z.string().uuid(),
		name: SecureSchemas.safeText.optional(),
		email: SecureSchemas.email.optional(),
		role: z
			.enum([
				"Tenant Admin",
				"Manager",
				"Supervisor",
				"Senior Staff",
				"Staff",
				"Junior Staff",
				"Viewer",
			])
			.optional(),
	}),

	// File upload
	fileUpload: z.object({
		fileName: SecureSchemas.fileName,
		fileSize: z
			.number()
			.positive()
			.max(100 * 1024 * 1024),
		mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-+]+$/i),
		clientId: z.number().positive().optional(),
	}),
};

/**
 * Rate limiting for API endpoints
 */
export const API_RATE_LIMITS = {
	// Authentication endpoints (handled separately)
	auth: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes

	// General API endpoints
	general: { requests: 100, window: 60 * 1000 }, // 100 requests per minute

	// File upload endpoints
	upload: { requests: 10, window: 60 * 1000 }, // 10 uploads per minute

	// Search endpoints
	search: { requests: 30, window: 60 * 1000 }, // 30 searches per minute

	// Bulk operations
	bulk: { requests: 5, window: 60 * 1000 }, // 5 bulk operations per minute

	// Reporting endpoints
	reports: { requests: 10, window: 60 * 1000 }, // 10 report generations per minute
};

/**
 * SQL injection prevention for dynamic queries
 */
export function sanitizeOrderBy(
	orderBy: string,
	allowedColumns: string[],
): string | null {
	if (!orderBy || typeof orderBy !== "string") return null;

	// Remove any non-alphanumeric characters except underscore
	const sanitized = orderBy.replace(/[^a-zA-Z0-9_]/g, "");

	// Check if column is in allowed list
	if (!allowedColumns.includes(sanitized)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid order by column",
		});
	}

	return sanitized;
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
	if (!query || typeof query !== "string") return "";

	// Remove SQL injection patterns
	const dangerous = [
		/('|(\\'))+.*(--)/i,
		/(;|\s)(exec|execute|drop|create|alter|insert|update|delete|select|union|declare)\s/i,
		/(\s|^)(union|select|insert|delete|update|drop|create|alter|exec|execute)(\s|$)/i,
	];

	for (const pattern of dangerous) {
		if (pattern.test(query)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid search query",
			});
		}
	}

	// Sanitize and limit length
	return query.trim().slice(0, 100);
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: {
	fileName: string;
	fileSize: number;
	mimeType: string;
}): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check file name
	const fileNameValidation = sanitizeFileName(file.fileName);
	if (!fileNameValidation.isValid) {
		errors.push(...(fileNameValidation.errors || []));
	}

	// Check file size (100MB limit)
	if (file.fileSize > 100 * 1024 * 1024) {
		errors.push("File size exceeds 100MB limit");
	}

	// Check MIME type whitelist
	const allowedMimeTypes = [
		// Documents
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		// Images
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		// Text
		"text/plain",
		"text/csv",
		// Archives
		"application/zip",
		"application/x-zip-compressed",
	];

	if (!allowedMimeTypes.includes(file.mimeType)) {
		errors.push("File type not allowed");
	}

	return { isValid: errors.length === 0, errors };
}

/**
 * Error handler for API security violations
 */
export function handleSecurityError(error: any, context?: Context): TRPCError {
	// Log security incidents
	console.error("🚨 API Security Error:", {
		timestamp: new Date().toISOString(),
		error: error.message,
		userId: context?.user?.id,
		tenantId: context?.tenantId,
		stack: error.stack,
	});

	// Return safe error messages to client
	if (error instanceof TRPCError) {
		return error;
	}

	return new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: "A security error occurred",
	});
}

// Re-export validation functions for use in other modules
import { validateResourceTenantAccess } from "./tenant-isolation";
export { validateResourceTenantAccess };

// Import sanitizeFileName from input-validation to avoid conflicts
import { sanitizeFileName } from "./input-validation";
export { sanitizeFileName };
