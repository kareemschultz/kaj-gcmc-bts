/**
 * Enterprise Security Middleware for KAJ-GCMC Platform
 * Comprehensive API protection, input validation, and security controls
 */

import type { UserRole } from "@GCMC-KAJ/types";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getUserTenantRole } from "./index";

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration
export const SECURITY_CONFIG = {
	rateLimit: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 100, // requests per window
		skipSuccessfulGET: true,
		bypassTokens: [], // Add admin bypass tokens if needed
	},
	cors: {
		allowedOrigins: [
			process.env.WEB_URL || "http://localhost:3001",
			process.env.PORTAL_URL || "http://localhost:3002",
			...(process.env.ADDITIONAL_ORIGINS?.split(",") || []),
		],
		allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"X-CSRF-Token",
			"X-Tenant-ID",
		],
		credentials: true,
		maxAge: 86400, // 24 hours
	},
	validation: {
		maxBodySize: 10 * 1024 * 1024, // 10MB
		allowedFileTypes: [
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"text/csv",
			"image/jpeg",
			"image/png",
			"image/webp",
		],
		maxFileSize: 50 * 1024 * 1024, // 50MB
	},
} as const;

// Input sanitization schemas
export const sanitizationSchemas = {
	email: z.string().email().max(254).toLowerCase(),
	name: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[a-zA-Z\s\-'.]+$/, "Invalid name format"),
	searchQuery: z
		.string()
		.max(100)
		.regex(/^[a-zA-Z0-9\s\-_@.]+$/, "Invalid search query"),
	id: z.string().uuid("Invalid ID format"),
	tenantCode: z
		.string()
		.min(1)
		.max(50)
		.regex(/^[a-z0-9-]+$/, "Invalid tenant code"),
	phoneNumber: z.string().regex(/^\+?[\d\s\-()]+$/, "Invalid phone number"),
	url: z.string().url().max(500),
	filename: z
		.string()
		.min(1)
		.max(255)
		.regex(/^[a-zA-Z0-9\-_.\s]+$/, "Invalid filename"),
};

// SQL injection prevention
export function sanitizeForSQL(input: string): string {
	return input.replace(/['"\\;]/g, "");
}

// XSS prevention
export function sanitizeForXSS(input: string): string {
	return input
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
	const buffer = new Uint8Array(32);
	crypto.getRandomValues(buffer);
	return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

export function validateCSRFToken(
	token: string,
	_sessionToken: string,
): boolean {
	// In production, store CSRF tokens in session/database
	// For now, basic validation
	return token && token.length === 64 && /^[a-f0-9]+$/.test(token);
}

// Rate limiting middleware
export function createRateLimiter(options: {
	windowMs: number;
	maxRequests: number;
	keyGenerator?: (req: NextRequest) => string;
}) {
	return function rateLimiter(req: NextRequest): {
		allowed: boolean;
		resetTime?: number;
	} {
		const key = options.keyGenerator?.(req) || getClientIdentifier(req);
		const now = Date.now();
		const _windowStart = now - options.windowMs;

		// Clean up old entries
		if (Math.random() < 0.1) {
			// 10% chance to cleanup
			for (const [k, v] of rateLimitStore.entries()) {
				if (v.resetTime < now) {
					rateLimitStore.delete(k);
				}
			}
		}

		const current = rateLimitStore.get(key);

		if (!current || current.resetTime < now) {
			// First request or window expired
			rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
			return { allowed: true };
		}

		if (current.count >= options.maxRequests) {
			return { allowed: false, resetTime: current.resetTime };
		}

		current.count++;
		rateLimitStore.set(key, current);
		return { allowed: true };
	};
}

// Get client identifier for rate limiting
function getClientIdentifier(req: NextRequest): string {
	// Try to get real IP (considering proxies)
	const forwardedFor = req.headers.get("X-Forwarded-For");
	const realIP = req.headers.get("X-Real-IP");
	const clientIP = forwardedFor?.split(",")[0] || realIP || req.ip || "unknown";

	// Combine with user agent for better identification
	const userAgent = req.headers.get("User-Agent") || "unknown";
	return `${clientIP}:${userAgent.slice(0, 50)}`;
}

// CORS middleware
export function handleCORS(req: NextRequest, origin?: string): Response | null {
	const requestOrigin = origin || req.headers.get("Origin");

	if (req.method === "OPTIONS") {
		// Preflight request
		if (
			!requestOrigin ||
			!SECURITY_CONFIG.cors.allowedOrigins.includes(requestOrigin)
		) {
			return new Response("CORS policy violation", { status: 403 });
		}

		return new Response(null, {
			status: 200,
			headers: {
				"Access-Control-Allow-Origin": requestOrigin,
				"Access-Control-Allow-Methods":
					SECURITY_CONFIG.cors.allowedMethods.join(", "),
				"Access-Control-Allow-Headers":
					SECURITY_CONFIG.cors.allowedHeaders.join(", "),
				"Access-Control-Allow-Credentials":
					SECURITY_CONFIG.cors.credentials.toString(),
				"Access-Control-Max-Age": SECURITY_CONFIG.cors.maxAge.toString(),
			},
		});
	}

	return null; // Not an OPTIONS request
}

// Input validation middleware
export async function validateRequestBody<T>(
	req: NextRequest,
	schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
	try {
		const contentType = req.headers.get("Content-Type");

		if (!contentType?.includes("application/json")) {
			return { success: false, error: "Content-Type must be application/json" };
		}

		const body = await req.json();
		const result = schema.safeParse(body);

		if (!result.success) {
			const errors = result.error.errors.map(
				(err) => `${err.path.join(".")}: ${err.message}`,
			);
			return {
				success: false,
				error: `Validation failed: ${errors.join(", ")}`,
			};
		}

		return { success: true, data: result.data };
	} catch (_error) {
		return { success: false, error: "Invalid JSON body" };
	}
}

// Authorization middleware
export async function checkPermission(
	userId: string,
	module: string,
	action: string,
	resourceTenantId?: number,
): Promise<{ allowed: boolean; reason?: string }> {
	try {
		const userTenantRole = await getUserTenantRole(userId);

		if (!userTenantRole) {
			return { allowed: false, reason: "User not assigned to any tenant" };
		}

		// Check tenant isolation
		if (resourceTenantId && resourceTenantId !== userTenantRole.tenantId) {
			return {
				allowed: false,
				reason: "Access denied: tenant isolation violation",
			};
		}

		// Import permission check from RBAC system
		// This would typically check against the permissions table
		const hasPermission = await checkUserPermission(
			userTenantRole.role,
			module,
			action,
		);

		return {
			allowed: hasPermission,
			reason: hasPermission
				? undefined
				: `Access denied: insufficient permissions for ${module}:${action}`,
		};
	} catch (error) {
		console.error("Authorization check failed:", error);
		return { allowed: false, reason: "Authorization check failed" };
	}
}

// Mock permission check (replace with actual RBAC implementation)
async function checkUserPermission(
	role: UserRole,
	module: string,
	action: string,
): Promise<boolean> {
	// This would query the permissions table in production
	const rolePermissions: Record<UserRole, string[]> = {
		FirmAdmin: ["*:*"], // Full access
		ComplianceOfficer: [
			"clients:*",
			"documents:*",
			"filings:*",
			"compliance:*",
			"analytics:view",
		],
		PreparerSenior: ["clients:*", "documents:*", "filings:create,edit,view"],
		Preparer: [
			"clients:view,create,edit",
			"documents:view,create",
			"filings:view,create",
		],
		ClientManager: ["clients:*", "tasks:*", "notifications:*"],
		Auditor: [
			"clients:view",
			"documents:view",
			"filings:view",
			"analytics:*",
			"compliance:view",
		],
		ClientUser: ["profile:*", "documents:view", "tasks:view"],
		Viewer: [
			"clients:view",
			"documents:view",
			"filings:view",
			"analytics:view",
		],
	};

	const permissions = rolePermissions[role] || [];

	// Check for wildcard permission
	if (permissions.includes("*:*")) return true;

	// Check for module wildcard
	if (permissions.includes(`${module}:*`)) return true;

	// Check for specific permission
	if (permissions.includes(`${module}:${action}`)) return true;

	return false;
}

// File upload security
export function validateFileUpload(file: File): {
	valid: boolean;
	error?: string;
} {
	// Check file size
	if (file.size > SECURITY_CONFIG.validation.maxFileSize) {
		return {
			valid: false,
			error: `File size exceeds limit of ${SECURITY_CONFIG.validation.maxFileSize / (1024 * 1024)}MB`,
		};
	}

	// Check file type
	if (!SECURITY_CONFIG.validation.allowedFileTypes.includes(file.type)) {
		return {
			valid: false,
			error: `File type ${file.type} is not allowed`,
		};
	}

	// Check filename
	const filenameValidation = sanitizationSchemas.filename.safeParse(file.name);
	if (!filenameValidation.success) {
		return {
			valid: false,
			error: "Invalid filename format",
		};
	}

	return { valid: true };
}

// Security audit logging
export function logSecurityEvent(event: {
	type:
		| "authentication"
		| "authorization"
		| "validation"
		| "rate_limit"
		| "file_upload";
	severity: "info" | "warning" | "error";
	userId?: string;
	ip?: string;
	userAgent?: string;
	details: Record<string, unknown>;
}) {
	const logEntry = {
		timestamp: new Date().toISOString(),
		type: event.type,
		severity: event.severity,
		userId: event.userId,
		ip: event.ip,
		userAgent: event.userAgent,
		details: event.details,
	};

	// In production, send to logging service (e.g., Winston, Datadog, etc.)
	console.log("SECURITY_AUDIT:", JSON.stringify(logEntry));

	// Also store critical events in database for compliance
	if (event.severity === "error") {
		// Store in audit_logs table
	}
}

// Environment variable validation for production
export function validateProductionConfig(): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	const requiredEnvVars = [
		"DATABASE_URL",
		"NEXTAUTH_SECRET",
		"CORS_ORIGIN",
		"WEB_URL",
		"REDIS_URL",
		"MINIO_ENDPOINT",
	];

	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			errors.push(`Missing required environment variable: ${envVar}`);
		}
	}

	// Check for strong secrets
	if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
		errors.push("NEXTAUTH_SECRET must be at least 32 characters long");
	}

	// Validate URLs
	try {
		if (process.env.WEB_URL) new URL(process.env.WEB_URL);
		if (process.env.PORTAL_URL) new URL(process.env.PORTAL_URL);
	} catch {
		errors.push("Invalid URL format in WEB_URL or PORTAL_URL");
	}

	return { valid: errors.length === 0, errors };
}

// Production security checklist
export function runSecurityChecklist(): {
	passed: string[];
	failed: string[];
	warnings: string[];
} {
	const passed: string[] = [];
	const failed: string[] = [];
	const warnings: string[] = [];

	// Check environment
	const configValidation = validateProductionConfig();
	if (configValidation.valid) {
		passed.push("Environment configuration");
	} else {
		failed.push(
			`Environment configuration: ${configValidation.errors.join(", ")}`,
		);
	}

	// Check HTTPS in production
	if (process.env.NODE_ENV === "production") {
		if (process.env.WEB_URL?.startsWith("https://")) {
			passed.push("HTTPS enforcement");
		} else {
			failed.push("HTTPS not enforced in production");
		}
	}

	// Check for secure cookies
	if (process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN) {
		passed.push("Secure cookie configuration");
	} else if (process.env.NODE_ENV === "production") {
		warnings.push("COOKIE_DOMAIN not set for production");
	}

	// Check rate limiting
	if (rateLimitStore instanceof Map) {
		warnings.push(
			"Using in-memory rate limiting (consider Redis for production)",
		);
	}

	return { passed, failed, warnings };
}
